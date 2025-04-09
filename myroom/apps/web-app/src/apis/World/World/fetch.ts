import onRequest, {RequestInstance} from "@/common/utils/fetch";

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getWorld(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/world/world/${id}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getWorldBan(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/world/world/${id}/ban`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getWorldEnum(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/world/world/${id}/enum`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 