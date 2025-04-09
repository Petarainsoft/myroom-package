import useProfileAPI from "@/apis/User/Profile";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ItemRectCard } from "../ItemRectCard";
import { SceneManager } from "@/common/utils/client";
import useAvatarAPI from "@/apis/Space/Avatar";
import usePopup from "@/common/hooks/Popup/usePopup";

type FigureCardProps = {
    profileId?: string;
    avatarId?: string;
    onAfterClick?: () => void;
}

const FigureCard = ({ profileId, avatarId, onAfterClick }: FigureCardProps) => {
    const { showToastPopup } = usePopup();
    const { fetchProfile } = useProfileAPI();
    const { fetchAvatar } = useAvatarAPI();

    const { data: avatarData, isLoading: isAvatarLoading } = fetchAvatar(avatarId);

    const figureProfileId = useMemo(() => {
        return profileId ?? avatarData?.data?.profile_id;
    }, [profileId, avatarData]);
    
    const { data: profileData, isLoading: isProfileLoading } = fetchProfile(figureProfileId);

    const figureId = useMemo(() => { 
        return avatarId ?? profileData?.data?.avatar_id;
    }, [avatarId, profileData]);

    const [selected, setSelected] = useState(false);
    

    const handleClick = useCallback(() => {
        if(figureId) {
            SceneManager.Room?.placeNewFigure(figureId, false);
            SceneManager.Room?.deselectTarget();

            if(onAfterClick)
                onAfterClick();
        }
    }, [figureId, onAfterClick]);

    useEffect(()=>{
        if(profileData) {
            const avatarId = profileData?.data?.avatar_id;
            if(avatarId) {
                SceneManager.Room?.getAllFigureIds((ids)=>{
                    setSelected(ids.includes(avatarId));
                });
            }
        }
    
    },[profileData]);


    return <ItemRectCard key={profileId} thumbnail={profileData?.data?.resource?.image_selfie} onClick={handleClick} text={profileData?.data?.option?.nick} desc={`@${profileData?.data?.name}`} selected={selected}/>
}

export default FigureCard;