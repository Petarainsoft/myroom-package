import onRequest, {RequestInstance} from "@/common/utils/fetch";
import { BannerParams } from "./type";

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function getBanner(instance:RequestInstance, params:BannerParams) {
    return await onRequest<any>(instance, `/v1/world/banner`, {method : "GET", params, headers : {"accept": " application/json", "Content-Type": "application/json"}});
} 
