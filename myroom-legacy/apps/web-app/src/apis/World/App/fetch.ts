import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { AppInfoResponse } from "./type";
/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getApp(instance:RequestInstance, id:string) {
    return await onRequest<AppInfoResponse>(instance, `/v1/world/apps/app/${id}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 
