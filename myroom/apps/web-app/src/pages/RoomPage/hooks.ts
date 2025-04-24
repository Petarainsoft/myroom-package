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
    const { currentRoomInfo, setCurrentRoomInfo, roomSelectedItem, hideRoomPlaceUI, meRoomManifest, roomBackgroundColor, setRoomBackgroundColor, recommendFigures } = useRoom();
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
        if(sceneStatus === 'UNINITIALIZED') {
            if (!loadingFullScreenModal.isOpen) {
                loadingFullScreenModal.createModal();
            }
        }
        else if(sceneStatus === 'INITIALIZED' && roomManifestData) {
            SceneManager.Room?.initializeMyRoom(roomManifestData as IAssetManifest_MyRoom , false, () => {
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