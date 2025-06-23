import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { MemoData, MemosParams } from "./type";

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function getMemos(instance:RequestInstance, params:MemosParams) {
    return await onRequest<any>(instance, `/v1/social/memos`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function posttMemos(instance:RequestInstance, data:MemoData) {
    return await onRequest<any>(instance, `/v1/social/memos`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getMemo(instance:RequestInstance, id?:string) {
    return await onRequest<any>(instance, `/v1/social/memos/${id}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @param data 
 * @returns 
 */
export async function postMemo(instance:RequestInstance, id:string, data:MemoData) {
    return await onRequest<any>(instance, `/v1/social/memos/${id}`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function delMemo(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/social/memos/${id}`, {method : "DELETE", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 