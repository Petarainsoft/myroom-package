import useProfileAPI from "@/apis/User/Profile";
import { useMemo } from "react";



const useAvatarNickname = (profileId: string) => {
    const { fetchProfile } = useProfileAPI();

    const { data } = fetchProfile(profileId);

    const nickname = useMemo(() => {
        return data?.data.option.nick;
     }, [profileId, data]);


    return { nickname }
}


export default useAvatarNickname;