import { useSetAtom } from "jotai";
import { avatarInfoStatusAtom } from "../store";
import { useCallback, useEffect, useMemo, useState } from "react";
import useProfileAPI from "@/apis/User/Profile";
import useReactionAPI from "@/apis/Social/Reaction";
import useStatusMessageAPI from "@/apis/Social/StatusMessage";
import useMe from "@/common/hooks/use-me";
import { SceneManager } from "@/common/utils/client";
import { ECameraMode } from "client-core";


type useMainModeProps = {
    profileId: string;
}
const useMainMode = ({ profileId }: useMainModeProps) => { 
    const { meProfileId } = useMe();
    const { fetchProfile } = useProfileAPI();
    const { fetchProfileResourceStatusMessage  } = useStatusMessageAPI();

    const { fetchReaction, fetchMyReaction, mutationPostReaction } = useReactionAPI();
    
    const { data: profileData, isLoading: isProfileLoading } = fetchProfile(profileId);

    const { data : messageData , isLoading: isMessageLoading } = fetchProfileResourceStatusMessage({profileId});

    const messageId = useMemo(() => {
        return messageData?.data?.feed_id? messageData?.data?.feed_id : undefined;
    }, [messageData]);
    
    const { data: meReactionData, isLoading: isMeReactionLoading } = fetchMyReaction(messageId);
    const { data: reactionData, isLoading: isReactionLoading } = fetchReaction(messageId);
    
    const [showComment, setShowComment] = useState(false);

    const isLiked = useMemo(() => { 
        if (!isMeReactionLoading) {
            return meReactionData?.data?.stat?.reaction?.like && meReactionData?.data?.stat?.reaction?.like > 0 ? true : false;
        }

        return false;
    }, [isMeReactionLoading, meReactionData]);


    const commentCount = useMemo(() => {
        if (!isReactionLoading) {
            return reactionData?.data?.stat?.comment;
        }

        return 0;
    }, [reactionData, isReactionLoading]);
    
    const likeCount = useMemo(() => {
        if (!isReactionLoading) {
            return reactionData?.data?.stat?.reaction?.like;
        }

        return 0;
    }, [reactionData, isReactionLoading]);
    
    const targetRoomId = useMemo(() => {
        return profileData?.data?.myroom_id;
     }, [profileData]);

    const handleToggleLike = useCallback(async () => { 
        await mutationPostReaction.mutateAsync({
            id: messageId,
            params: {
                origin_profile_id: messageId,
                reaction: "like"
            }
        });
    }, [messageId, mutationPostReaction]);
    
    const handleClickCloseComment = useCallback(() => {
        setShowComment(false);
    }, []);
    
    const handleClickOpenComment = useCallback(() => {
        setShowComment(true);
     }, []);

    const setAvatarInfoStatus = useSetAtom(avatarInfoStatusAtom);

    const nickname = useMemo(() => {
        return profileData?.data.option.nick;
    }, [profileData]);
        
    const handleClickStatusMode = useCallback(() => { 
        setAvatarInfoStatus('EDIT_STATUS');
    }, [setAvatarInfoStatus]);

    const handleClickCustomMode = useCallback(() => {
        setAvatarInfoStatus('CUSTOM');
     }, [setAvatarInfoStatus]);

    useEffect(() => {
        SceneManager.Avatar?.setCameraMode(ECameraMode.Avatar); 
    }, []);

    
    return {showComment, meProfileId, isLiked, likeCount, commentCount, targetRoomId, messageId, nickname, profileId, handleToggleLike, handleClickStatusMode, handleClickCustomMode, handleClickOpenComment, handleClickCloseComment, isProfileLoading}
};

export default useMainMode;