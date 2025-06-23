import useAvatarAPI from "@/apis/Space/Avatar";
import React, { useMemo } from "react"
import AvatarNickname from "./AvatarNickname";
import AvatarStatusMessage from "./AvatarStatusMessage";

type AvatarInfoProps = {
    id: string;
    isAvatar: boolean;
}

const AvatarInfo = ({ id, isAvatar }:AvatarInfoProps) => {
    const { fetchAvatar } = useAvatarAPI();

    const { data: avatarData } = fetchAvatar(id);

    const profileId = useMemo(() => {
        return avatarData?.data.profile_id;
    }, [avatarData]);
    
    return <React.Fragment>
        {profileId && <React.Fragment>
            <AvatarStatusMessage id={id} profileId={profileId} isAvatar={isAvatar}  />
            <AvatarNickname id={id} profileId={profileId} />
        </React.Fragment>}
    </React.Fragment>
}

export default AvatarInfo;