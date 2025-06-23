import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { TermsResponse } from "./type";

/**
 * 
 * @param instance 
 * @param id 
 * @returns 
 */
export async function getTerms(instance:RequestInstance, id:string) {
    return await onRequest<TermsResponse>(instance, `/v1/world/terms/${id}`, {method : "GET", headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 
