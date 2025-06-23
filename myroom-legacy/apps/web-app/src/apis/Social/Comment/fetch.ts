import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { CommentData, CommentsParams, CommentsResponse } from "./type";

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function getComments(instance:RequestInstance, params:CommentsParams) {
    return await onRequest<CommentsResponse>(instance, `/v1/social/comments`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postComments(instance:RequestInstance, data:CommentData) {
    return await onRequest<any>(instance, `/v1/social/comments`, {method : "POST", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getComment(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/social/comments/${id}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @param data 
 * @returns 
 */
export async function patchComment(instance:RequestInstance, id:string,  data:CommentData) {
    return await onRequest<any>(instance, `/v1/social/comments/${id}`, {method : "PATCH", data, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function delComment(instance:RequestInstance, id:string) {
    return await onRequest<any>(instance, `/v1/social/comments/${id}`, {method : "DELETE", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 


