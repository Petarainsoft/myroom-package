import {useMutation, useQuery} from '@tanstack/react-query'
import {instance} from '@/common/utils/axios';
import { getUser, getUsersMe, getUsersMeApp,  getUsersMeProfiles,  postUsersMe, postUsersMeApp } from './fetch';
import { UsersMeData,UsersMeAppData, UsersMeProfilesParams} from './type';
import useAuth from '@/common/hooks/use-auth';



const useUserAPI = () => {
    const { isLogined } = useAuth();

    /**
     * 
     * @returns 
     */
    const fetchUsersMe = () => {
        return useQuery([`fetchUsersMe`], async () => await getUsersMe(instance), {enabled : isLogined});
    };

    /**
     * 
     */
    const mutationUsersMe = useMutation(async (payload: { data?: UsersMeData }) => await postUsersMe(instance, payload.data??null));

    /**
     * 
     * @returns 
     */
    const fetchUsersMeApp = () => {
        return useQuery([`fetchUsersMeApp`], async () => await getUsersMeApp(instance),  {enabled : isLogined});
    };

    /**
     * 
     */
    const mutationPostUsersMeApp = useMutation(async (payload: { data: UsersMeAppData }) => await postUsersMeApp(instance, payload.data));

    /**
     * 
     * @param userId 
     * @returns 
     */
    const fetchUser = (userId:string) => {
        return useQuery([`fetchUser`, userId], async () => await getUser(instance, userId));
    };

    /**
     * 
     */
    const mutationUsersMeProfiles = useMutation(async (payload: { data: UsersMeProfilesParams }) => await getUsersMeProfiles(instance, payload.data));
    
    /**
     * 
     * @param page 
     * @param limit 
     * @returns 
     */
    const fetchUsersMeProfiles = (page:number, limit:number) => {
        return useQuery([`fetchUsersMeProfiles`], async()=>await getUsersMeProfiles(instance, {page:page, limit:limit}),  {enabled : isLogined});
    };
    
    return {fetchUsersMe, mutationUsersMe,fetchUsersMeApp,mutationUsersMeApp: mutationPostUsersMeApp,fetchUser, mutationUsersMeProfiles, fetchUsersMeProfiles}
}

export default useUserAPI;

