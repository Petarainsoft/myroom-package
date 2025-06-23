import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { RecommendationMyroomParams } from "./type";

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
*/
export async function getRecommendationMyRoom(instance:RequestInstance, params:RecommendationMyroomParams) {
    return await onRequest<any>(instance, `/v1/recommendation/myrooms`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

export async function getRecommendationMeFollowers(instance:RequestInstance) {
    return await onRequest<any>(
        instance, 
        `/v1/recommendation/profiles/me/followers`, 
        {
            method : "GET", 
            headers : {
                "accept": " application/json", 
                "Content-Type": "application/json"
            }
        }
    );
} 

export async function getRecommendationFollowers(instance:RequestInstance, profileId:string) {
    return await onRequest<any>(
        instance, 
        `/v1/recommendation/profiles/${profileId}/followers`, 
        {
            method : "GET", 
            headers : {
                "accept": " application/json", 
                "Content-Type": "application/json"
            }
        }
    );
} 

