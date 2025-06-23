import useStatusMessageAPI from "@/apis/Social/StatusMessage";
import { useMemo } from "react";
import useMe from "../use-me";



const useStatusMessage = (profileId: string) => {
    const { meProfileId } = useMe();
    const { fetchProfileResourceStatusMessage } = useStatusMessageAPI();
    const { data : statusMessageData, isLoading } = fetchProfileResourceStatusMessage({profileId: profileId === meProfileId? 'me' : profileId });
  

    const statusAvatarThumbnail = useMemo(()=>{
        return statusMessageData?.data?.resource?.image[0];
    },[statusMessageData]);


    const statusImage = useMemo(()=>{
        return statusMessageData?.data?.resource?.image[1];
    },[statusMessageData]);

    const statusMessage = useMemo(()=>{
        return statusMessageData?.data?.txt?.contents;
    },[statusMessageData]);

    const feedId = useMemo(()=>{
        return statusMessageData?.data?.feed_id;
    },[statusMessageData]);

    const createTime = useMemo(()=>{
        return statusMessageData?.data?.option?.startts;
    },[statusMessageData]);

    
  
    return { isLoading, statusImage, statusMessage, statusAvatarThumbnail, feedId, createTime };
    
    return {}
}

export default useStatusMessage;