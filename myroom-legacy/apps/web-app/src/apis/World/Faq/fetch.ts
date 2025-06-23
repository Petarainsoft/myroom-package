import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { FaqParams, FaqsParams } from "./type";

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getFaqs(instance:RequestInstance, params:FaqsParams) {
    return await onRequest<any>(instance, `/v1/world/faq`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getFaq(instance:RequestInstance, id:string, params:FaqParams) {
    return await onRequest<any>(instance, `/v1/world/faq/${id}`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 
