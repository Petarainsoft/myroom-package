import useModal from "@/common/hooks/Modal/useModal";
import useRoom from "@/common/hooks/use-room";
import { SceneManager } from "@/common/utils/client";
import { SelectionInfo } from "client-core/assetSystem/controllers/roomSubSystem/InputHandler_PlaceMode";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";


let callbackAnimaion : any = null;
const useMain = () => {
    const navigate = useNavigate();

    const { currentRoomInfo, showAlwaysRoomInfo, setShowAlwaysRoomInfo, setRoomSelectedItem, roomSelectedItem} = useRoom();
    const itemFullScreenModal = useModal('ItemFullScreenModal');
    const avatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');
    const balloonMessageListFullScreenModal = useModal(
        'BalloonMessageListFullScreenModal',
      );

    const handleToggle = useCallback(()=>{
        setShowAlwaysRoomInfo(prev => !prev);
    },[setShowAlwaysRoomInfo]);

    const handleClickPlace = useCallback(()=>{
        navigate('/rooms/me/place');
    },[]);

    const handleClickZoomOut = useCallback(()=>{
        SceneManager.Room?.setCameraDist(1);
    },[]);

    const handleClickBalloon = useCallback(() => {
        balloonMessageListFullScreenModal.createModal({});
    }, [balloonMessageListFullScreenModal]);

    const callbackZoomOutHandler = useCallback(() => { 
        SceneManager.Room?.addCameraDistanceChangeEventHandler((dist)=>{
            if (dist > 0.25) {
               
                setRoomSelectedItem(null);
            
                if (callbackAnimaion) {
                    callbackAnimaion();
                    callbackAnimaion = null;
                }  

                SceneManager.Room?.clearDistanceChangeEventHandler();
            }
        });
    }, [setRoomSelectedItem]);
    
    const callbackRoomPlacementSelectionChanged = useCallback((info:SelectionInfo)=>{
        const itemInstanceId = info.getId();
        const itemId = info.getItemId();
        const isFigure= info.isFigure();
        const isOutside = info.isOutside();

        if(itemInstanceId === '') {
            return;
        }

        if(roomSelectedItem?.id === itemInstanceId || showAlwaysRoomInfo) {
            if(isFigure) {
                avatarInfoFullScreenModal.createModal({
                    avatarId: itemInstanceId,
                });
            }
            else {
                itemFullScreenModal.createModal({
                    itemId: itemId,
                    itemInstanceId: itemInstanceId,
                    mode: 'VIEW',
                });
            }
        }
        else {
            setRoomSelectedItem({
                id : itemInstanceId,
                type: isFigure? (currentRoomInfo?.avatarId === itemInstanceId? "AVATAR" : "FIGURE" ) : "ITEM",
            });

            if(isFigure) {
                SceneManager.Room?.findAvatarController(itemInstanceId, (controller)=>{
                    if (controller) {
                        if (callbackAnimaion) {
                            SceneManager.Room?.clearDistanceChangeEventHandler();
                            controller.zoomIn(callbackZoomOutHandler);
                        }
                        else {
                            callbackAnimaion = controller.zoomIn(callbackZoomOutHandler);
                        }
                        
                    }
                }, isOutside);
            }
            else {
                SceneManager.Room?.findItemController(itemInstanceId, (controller)=>{
                    if (controller) {
                        if (callbackAnimaion) {
                            SceneManager.Room?.clearDistanceChangeEventHandler();
                            controller.zoomIn(callbackZoomOutHandler);
                        }
                        else {
                            callbackAnimaion = controller.zoomIn(callbackZoomOutHandler);
                        }
                        
                    }
                });
            }
        }
    }, [roomSelectedItem, showAlwaysRoomInfo, avatarInfoFullScreenModal, itemFullScreenModal, setRoomSelectedItem, currentRoomInfo, callbackZoomOutHandler]);

    useEffect(()=>{
        SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
        return ()=>{
            SceneManager.Room?.removeCallbackPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
        }
    }, [callbackRoomPlacementSelectionChanged]);

    useEffect(() => { 
        // recommendFigures();
    }, []);

    return {roomSelectedItem, currentRoomInfo, showAlwaysRoomInfo, handleToggle, handleClickPlace, handleClickZoomOut, handleClickBalloon}
}

export default useMain;