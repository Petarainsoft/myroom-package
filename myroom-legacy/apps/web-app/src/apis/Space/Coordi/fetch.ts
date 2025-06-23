import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { CoordiData, CoordisParams } from "./type";



/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postCoordis(instance: RequestInstance,  data:CoordiData) {
    return await onRequest<any>(instance, `/v1/space/avatar-coordis`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param coordiId 
 * @returns 
 */
export async function delCoordi(instance: RequestInstance, coordiId: string) {
    return await onRequest<any>(instance, `/v1/space/avatar-coordis/${coordiId}`, {method : "DELETE", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

export async function getCoordi(instance: RequestInstance, coordiId: string) {
    return await onRequest<any>(instance, `/v1/space/avatar-coordis/${coordiId}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

export async function getCoordisMe(instance: RequestInstance, params:CoordisParams) {
    return await onRequest<any>(instance, `/v1/space/profiles/me/avatar-coordis`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 