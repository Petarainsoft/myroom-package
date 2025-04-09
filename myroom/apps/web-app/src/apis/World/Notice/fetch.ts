import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { NoticeParams, NotiesParams } from "./type";

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getNoties(instance:RequestInstance, params:NotiesParams) {
    return await onRequest<any>(instance, `/v1/world/notice`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getNotice(instance:RequestInstance, id:string, params:NoticeParams) {
    return await onRequest<any>(instance, `/v1/world/notice/${id}`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 
