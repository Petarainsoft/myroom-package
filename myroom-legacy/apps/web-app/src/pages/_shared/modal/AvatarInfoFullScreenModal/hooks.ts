import useAvatarAPI from "@/apis/Space/Avatar";
import useModal from "@/common/hooks/Modal/useModal";
import { SceneManager } from "@/common/utils/client";
import { useAtom, useSetAtom } from "jotai";
import React, { useMemo } from "react";
import { useCallback } from "react";
import { avatarInfoStatusAtom, currentEquipItemsAtom } from "./store";
import useThumbnail from "@/common/hooks/use-thumbnail";
import usePopup from "@/common/hooks/Popup/usePopup";
import useProfileAPI from "@/apis/User/Profile";
import { logger } from "@/common/utils/logger";
import { t } from "i18next";
import useStatusMessage from "./StatusMessageMode/useStatusMessage";
import { isAvatarModalOpenAtom } from "@/common/stores";
import useScene from "@/common/hooks/use-scene";

export type AvatarInfoStatus = 'MAIN' | 'CUSTOM' | 'EDIT_STATUS';

const useAvatarInfoFullScreenModal = (avatarId: string, itemId?:string) => {
    // 추후 리펙토링할것 
    //const { useSaveStatusMessageEditor : handleStatusMessageEditor } = useStatusMessage();

    const { sceneStatus, setSceneStatus} = useScene();
    const AvatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');
    
    const { createThumbnail } = useThumbnail();
    const { showToastPopup } = usePopup();
    
    const [avatarInfoStatus, setAvatarInfoStatus] = useAtom(avatarInfoStatusAtom);
    const setCurrentEquipItems = useSetAtom(currentEquipItemsAtom);
    const setIsAvatarModal = useSetAtom(isAvatarModalOpenAtom);

    const { fetchAvatar, fetchAvatarManifest, mutationPatchAvatar } = useAvatarAPI();
    const { mutationPostProfile } = useProfileAPI();
    
    const { data: avatarData } = fetchAvatar(avatarId);
    const { data: avatarManifest, isSuccess } = fetchAvatarManifest(avatarId, avatarData?.data?.option?.version);

    const { useSaveStatusMessageEditor: handleStatusMessageEditor } = useStatusMessage();
    
    const profileId = useMemo(() => {
        return avatarData?.data?.profile_id? avatarData?.data?.profile_id : "";
    }, [avatarData]);
    
    const handleClickClose = useCallback(() => {
        switch (avatarInfoStatus) {
            case "MAIN":
                AvatarInfoFullScreenModal.deleteModal();
                break;
            case "CUSTOM":
            case "EDIT_STATUS":
                setAvatarInfoStatus('MAIN');
                break;
        }

    }, [AvatarInfoFullScreenModal, avatarInfoStatus, setAvatarInfoStatus]);

    const onAfterSceneReady = useCallback(() => {
        setSceneStatus('INITIALIZED');
    }, []);


     /**
     * 아바타 커스텀 저장
     */
    const handleClickCustomSave = useCallback(() => {       
        if (!profileId) return;


        SceneManager.Avatar?.makeAvatarManifest(async (manifest) => { 
            if (manifest) {
                const res = await mutationPatchAvatar.mutateAsync({
                    id: avatarId,
                    data: { manifest: manifest as any},
                });
          
                if (res && res.data) {
                    createThumbnail(SceneManager.Avatar, async (id: string) => {
                        await mutationPostProfile.mutateAsync({
                            profileId: profileId,
                            data: {
                            resource: {
                                image_selfie: id,
                            },
                            },
                        });

                        // 룸 아바타 갱신.
                        SceneManager.Room?.refreshFigureModels([avatarId]);
                        
                        // 아바타 메인으로 이동
                        setAvatarInfoStatus('MAIN');

                        showToastPopup({ titleText: t('#저장이 완료되었습니다.') });
                    });
                } else {
                logger.log('handleAvatarSave Failed ', res);
                }
            }
        });        
    }, [avatarId, createThumbnail, mutationPatchAvatar, mutationPostProfile, profileId, setAvatarInfoStatus, showToastPopup]);

    /**
     * 아바타 상태메시지 저장
     */
    const handleClickStatusMesaageSave = useCallback(async () => {
        await handleStatusMessageEditor(avatarId);
        setAvatarInfoStatus('MAIN');
    }, [handleStatusMessageEditor, setAvatarInfoStatus, avatarId]);

    React.useEffect(() => { 
        setIsAvatarModal(true);
        return () => { 
            setCurrentEquipItems([]);
            setAvatarInfoStatus('MAIN');
            setIsAvatarModal(false);
        }
    }, []);

    React.useEffect(() => {
        if (sceneStatus === 'INITIALIZED' && avatarManifest) {
            SceneManager.Avatar?.initializeAvatar(avatarId, avatarManifest, () => {
                SceneManager.Avatar?.getAllAvatarEquipItems((ids) => {
                    setCurrentEquipItems([...ids]);
                    SceneManager.Avatar?.setDefaultAvatarCamera();
                 

                    if (itemId) {
                        setAvatarInfoStatus('CUSTOM');
                    }

                    setSceneStatus('LOADED');
                });
            });
        }
    }, [sceneStatus, avatarId, avatarManifest, itemId]);

    React.useEffect(() => {
        if (sceneStatus === 'LOADED' && avatarManifest?.main?.animation) {
            SceneManager.Avatar?.playAnimation(avatarManifest?.main?.animation, "_02");    
        }
     }, [sceneStatus, avatarManifest]);
 
    

    return { sceneStatus, profileId, avatarInfoStatus, isSuccess, handleClickClose, onAfterSceneReady, handleClickCustomSave, handleClickStatusMesaageSave}
}

export default  useAvatarInfoFullScreenModal;