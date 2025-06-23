import useMyRoomAPI from "@/apis/Space/MyRoom";
import useProfileAPI from "@/apis/User/Profile";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";




const useSearchRoomCard = (id: string) => { 
    const navigate = useNavigate();

    const { fetchMyroom } = useMyRoomAPI();
    const { fetchProfile } = useProfileAPI();

    const { data: roomData, isLoading: isRoomLoading, isSuccess : isRoomSuccess } = fetchMyroom(id);
    const { data: profileData, isLoading : isProfileLoading } = fetchProfile(isRoomSuccess? roomData?.data.profile_id : undefined);
    
    const isLoading = useMemo(() => {
        return isRoomLoading || isProfileLoading;
    }, [isRoomLoading, isProfileLoading]);


    const handleClick = useCallback(() => {
        navigate(`/rooms/${id}`);
    }, [id, navigate]);
    

    return {roomData, profileData, isLoading, handleClick}
};

export default useSearchRoomCard;