import useMyRoomAPI from "@/apis/Space/MyRoom";
import useProfileAPI from "@/apis/User/Profile";
import useModal from "@/common/hooks/Modal/useModal";
import usePopup from "@/common/hooks/Popup/usePopup";
import useAuth from "@/common/hooks/use-auth";
import useMe from "@/common/hooks/use-me";
import useRoom from "@/common/hooks/use-room";
import useScene from "@/common/hooks/use-scene";
import useThumbnail from "@/common/hooks/use-thumbnail";
import { uiProfileAtom } from "@/common/stores";
import { SceneManager } from "@/common/utils/client";
import { useOffCanvasOpenAndClose } from "@/common/utils/common.hooks";
import { IAssetManifest_MyRoom } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import { detailedDiff } from "deep-object-diff";
import { t } from "i18next";
import { useSetAtom } from "jotai";
import React, { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const useRoomPage = () => {
    const navigate = useNavigate();
    const { target } = useParams();
    const location = useLocation();
    const { isLogined } = useAuth();
    const { createThumbnail } = useThumbnail();
    const {sceneStatus, setSceneStatus} = useScene();
    const { currentRoomInfo, setCurrentRoomInfo, roomSelectedItem, hideRoomPlaceUI, adf, roomBackgroundColor, setRoomBackgroundColor, recommendFigures } = useRoom();

    const meRoomManifest = {
        main: {
          room: {
            backgroundColor: "#FFFFFF",
            templateId: "default_template", // template 3D
          },
          items: [
            {
              id: "chair_01",
              itemId: "chair_basic",
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
              },
              order: 1
            }
          ],
          figures: [
            {
              id: "avatar_01",
              avatarId: "default_avatar",
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 180, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
              },
              isAvatar: true
            }
          ],
          itemFunctionDatas: [] // optional
        }
      };

    const { meRoomId, meRoom, meProfileId, meBackGroundColor } = useMe();
    const { mutationPostProfile } = useProfileAPI();
    const { fetchMyroom, fetchMyroomManifest, mutationPatchMyroom} = useMyRoomAPI();
    const { fetchProfile } = useProfileAPI();
    const { showConfirmPopup, showToastPopup } = usePopup();
    const loadingFullScreenModal = useModal("LoadingFullScreenModal");
    const setUiProfile = useSetAtom(uiProfileAtom);
    const { handleOffCanvasOpen } = useOffCanvasOpenAndClose(setUiProfile);
    
    const roomId = useMemo(()=> target === 'me'? meRoomId : target,[target, meRoomId]);
    const {data : roomData} = fetchMyroom(roomId);
    const roomInfo = useMemo(()=> target === 'me'? meRoom : roomData?.data,[meRoom, roomData, target]);
    const {data : roomManifestData } = fetchMyroomManifest(roomId, roomInfo?.option?.version);
    const {data : profileData} = fetchProfile(roomInfo?.profile_id);

    const onAfterSceneReady = useCallback(()=>{
        setSceneStatus("INITIALIZED");
    },[]);

    const defaultManifest: IAssetManifest_MyRoom = {
        format: 3,
        main: {
          type: "MyRoom",
          room: {
            backgroundColor: "#6b8cc2ff",
            roomSkinId: "MduIuSfw0BxXIVLy8TWi0",
            grids: [
              {
                meshName: "Floor",
                isFloor: true,
                placementType: "Floor",
                gridNormal: "Y",
                width: 20,
                height: 20,
                gridOrigin: [0, 0, 0],
                markArray: [],
              },
              {
                meshName: "LeftWall",
                isFloor: false,
                placementType: "Wall",
                gridNormal: "X",
                width: 20,
                height: 20,
                gridOrigin: [0.1, 0, 0],
                markArray: [],
              },
              {
                meshName: "RightWall",
                isFloor: false,
                placementType: "Wall",
                gridNormal: "Z",
                width: 20,
                height: 20,
                gridOrigin: [0, 0, 0.1],
                markArray: [],
              },
            ],
          },
          defaultAvatarPos: {
            gridName: "Floor",
            fromX: 0,
            toX: 4,
            fromY: 0,
            toY: 4,
            rot: 0,
          },
        items: [
            {
                itemId: "MduK8VZ6o3Oj5S58soJdo",
                instanceId: "MduK8VZ6o3Oj5S58soJdo",   
                parentId: "Floor",               
                placeInfo: {
                gridName: "Floor",
                fromX: 10,
                toX: 12,
                fromY: 2,
                toY: 4,
                rot: 0,
                }
            },
            {
                itemId: "7Xy9bdWtdiQXlBG2b6AQi",
                instanceId: "7Xy9bdWtdiQXlBG2b6AQi",   
                parentId: "Floor",               
                placeInfo: {
                gridName: "Floor",
                fromX: 10,
                toX: 12,
                fromY: 8,
                toY: 10,
                rot: 0,
                }
            }
        ]
        },
      };

    const roomMode = useMemo(()=>{
        return location.pathname.includes('place')? 'PLACE' : 'MAIN';
    },[location]);

    const handleClickClose = useCallback(()=>{
        SceneManager.Room?.makeMyRoomManifest((manifest)=>{
            if(meRoomManifest && manifest) {
                const diff = detailedDiff(meRoomManifest, manifest);
                if (Object.keys(diff.added).length > 0 || Object.keys(diff.deleted).length > 0 || Object.keys(diff.updated).length > 0) {
                    showConfirmPopup({
                        titleText: t('GCM.000016'),
                        contentText: t('GCM.000017'),
                        cancelText: t('GCM.000019'),
                        confirmText: t('GCM.000018'),
                        onConfirm:()=> {
                            if (!loadingFullScreenModal.isOpen) {
                                loadingFullScreenModal.createModal();
                            }

                            setRoomBackgroundColor(meRoomManifest.main.room.backgroundColor);

                            SceneManager.Room?.clearMyRoom();
                            
                            SceneManager.Room?.initializeMyRoom(meRoomManifest, false, () => { 
                                loadingFullScreenModal.deleteModal();    
                                navigate('/rooms/me');
                            });
                        }
                    });
                } else {
                    navigate('/rooms/me');
                }
            }
        });
    },[meRoomManifest]);

    const handleClickSave = useCallback(()=>{
        if(!roomId) {
            return;
        }

        createThumbnail(SceneManager.Room, async (id)=>{
            SceneManager.Room?.makeMyRoomManifest(async (manifest)=>{
                if(!manifest) return;

                const resourceData : any = { image: [], video: [], thumbnail: id };

                const itemFuncData = manifest.main.itemFunctionDatas;
                if(itemFuncData) {
                    itemFuncData.map((data) => {
                      if(data.functionData) {
                        const isImage = data.functionData.includes('image');
                        const isVideo = data.functionData.includes('video');
                        const dataStrings = data.functionData.split('/');
                        const resourceId = dataStrings[dataStrings.length - 1].split('.')[0];
                        if(isImage) resourceData.image.push(resourceId);
                        else if(isVideo) resourceData.video.push(resourceId);
                      } else {
                        // do nothing
                      }
                    });
                }

                await mutationPatchMyroom.mutateAsync({id: roomId, data:{
                    manifest: manifest as any,
                    resource: resourceData
                }});

                if (meBackGroundColor !== roomBackgroundColor) {
                    if(meProfileId && roomBackgroundColor) {
                        await mutationPostProfile.mutateAsync({
                            profileId : meProfileId, 
                            data:{
                            option : {
                                background_color : roomBackgroundColor
                            }
                            }
                        });
                    }
                }
             
                showToastPopup({titleText: t('GMY.000008')});
                navigate('/rooms/me');
            });
        });
    },[createThumbnail, meProfileId, mutationPatchMyroom, mutationPostProfile, navigate, roomBackgroundColor, roomId, showToastPopup]);


    const handleClickProfile = useCallback(() =>{
        handleOffCanvasOpen();
    }, [handleOffCanvasOpen]);

    React.useEffect(() => { 
        const manifestToUse = roomManifestData ?? defaultManifest;
        console.log('🎃 Should Initial ROOOM ', sceneStatus, manifestToUse);
        if(sceneStatus === 'UNINITIALIZED') {
            if (!loadingFullScreenModal.isOpen) {
                loadingFullScreenModal.createModal();
            }
        }
        else if(sceneStatus === 'INITIALIZED' && manifestToUse) {
            SceneManager.Room?.initializeMyRoom(manifestToUse as IAssetManifest_MyRoom , false, () => {
                setSceneStatus('LOADED');
                loadingFullScreenModal.deleteModal();
            });
        }
    }, [sceneStatus, roomManifestData]);
    
    React.useEffect(()=>{
        if(roomInfo) {
            const info = { 
                id:roomInfo?._id,
                ownerId:roomInfo?.profile_id,
                avatarId:roomManifestData?.main.figures.filter((x:any) => x.isAvatar)[0].avatarId,
                mine: profileData?.data._id === meProfileId,
            }

            setCurrentRoomInfo(info);
        }
    },[target, roomInfo, roomManifestData, meProfileId, profileData]);

    React.useEffect(()=>{
        if(profileData) {
            setRoomBackgroundColor(profileData?.data?.option?.background_color);
        }
    },[profileData]);

    React.useEffect(()=>{
        // if(target === 'me' && !isLogined) {
        //     loadingFullScreenModal.deleteModal();
        //     navigate('/auth/signin');
        // }
        // else {
        //     if(target === meRoomId) {
                navigate('/rooms/me');
        //     }
        // }
    },[isLogined, target, meRoomId, loadingFullScreenModal]);

    return {sceneStatus, hideRoomPlaceUI, roomMode, roomBackgroundColor, currentRoomInfo, roomSelectedItem, handleClickClose, handleClickSave, handleClickProfile, onAfterSceneReady}
}

export default useRoomPage;