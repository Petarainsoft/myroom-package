import { CommonResponse } from "@/apis/_common/type";
import { UserMeResponse, UserMeProfilesResponse, UsersMeAppData, UsersMeData, UsersMeProfilesParams } from "./type";
import onRequest, {RequestInstance} from "@/common/utils/fetch";

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getUsersMe(instance:RequestInstance) {
    return await onRequest<UserMeResponse>(instance, `/v1/user/users/me`, {method : "GET"});
} 

/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postUsersMe(instance:RequestInstance, data:UsersMeData|null) {
    return await onRequest<UserMeResponse>(instance, `/v1/user/users/me`, {method : "POST", data});
} 

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getUsersMeApp(instance:RequestInstance) {
    return await onRequest<CommonResponse>(instance, `/v1/user/users/me/app`, {method : "GET"});
} 

/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postUsersMeApp(instance:RequestInstance, data:UsersMeAppData) {
    return await onRequest<any>(instance, `/v1/user/users/me/app`, {method : "POST", data});
} 

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function getUsersMeProfiles(instance:RequestInstance, params:UsersMeProfilesParams) {
    return await onRequest<UserMeProfilesResponse>(instance, `/v1/user/users/me/profiles`, {method : "GET", params});
} 

/**
 * 
 * @param instance 
 * @param userId 
 * @returns 
 */
export async function getUser(instance:RequestInstance, userId:string) {
    return await onRequest<any>(instance, `/v1/user/users/${userId}`, {method : "GET"});
} 



