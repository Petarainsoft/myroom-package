import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { ItemInstanceData, ItemInstancesData } from "./type";


/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postItemInstances(instance:RequestInstance, data:ItemInstancesData) {
    return await onRequest<any>(instance, `/v1/meta/item-instances`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param instanceId 
 * @param data 
 * @returns 
 */
export async function patchItemInstance(instance: RequestInstance, instanceId: string,  data:ItemInstanceData) {
    return await onRequest<any>(instance, `/v1/meta/item-instances/${instanceId}`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param instanceId 
 * @returns 
 */
export async function getItemInstance(instance: RequestInstance, instanceId: string,) {
    return await onRequest<any>(instance, `/v1/meta/item-instances/${instanceId}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 