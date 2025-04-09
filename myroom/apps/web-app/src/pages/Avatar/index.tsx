import useMe from "@/common/hooks/use-me";
import useModal from "@/common/hooks/Modal/useModal";
import React from "react";




const Avatar = () => { 

    const { meAvatarId, meProfileId } = useMe();

    const avatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');

    React.useEffect(() => {
        avatarInfoFullScreenModal.createModal({
            profileId: meProfileId,
            isOwner: false,
            avatarId: meAvatarId,
        });
        
        return () => { 
            
        }
     }, [avatarInfoFullScreenModal, meAvatarId, meProfileId]);
    return <></>
}

export default Avatar; 