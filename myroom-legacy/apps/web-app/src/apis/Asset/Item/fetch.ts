import { TEvtGoodsData, TEvtEnquetesData } from "./type";
import onRequest, { RequestInstance } from "@/common/utils/fetch";

/**
 * 샘플
 * 
 * @param instance 
 * @param params 
 * @returns 
 */

export async function postEvtEnquetes(instance: RequestInstance, data: TEvtEnquetesData) {
    return await onRequest(instance, '/enquetes', { method: "POST", data });
}
export async function postEvtRetweets(instance: RequestInstance) {
    return await onRequest(instance, '/retweets', { method: "POST" });
}
export async function postEvtGoods(instance: RequestInstance, data: TEvtGoodsData) {
    return await onRequest(instance, '/goods', { method: "POST", data });
}

export async function getChances(instance: RequestInstance,) {
    return await onRequest(instance, '/chances', { method: "GET" })
}

