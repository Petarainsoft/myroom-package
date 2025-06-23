import onRequest, { RequestInstance } from "@/common/utils/fetch";
import { MarketPurchaseData, MarketSearchParams as MarketProductsParams, MarketProductsResponse, MarketProductIdResponse, MarketPurchaseResponse } from "./type";


/**
 * 
 * @param instance 
 * @param productId 
 * @returns 
 */
export async function getProduct(instance: RequestInstance, productId?: string) {
    return await onRequest<MarketProductIdResponse>(instance, `/v1/meta/market/products/${productId}`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function getMarketProducts(instance: RequestInstance, params: MarketProductsParams) {
    return await onRequest<MarketProductsResponse>(instance, `/v1/meta/market/products`, { method: "GET", params, headers: { "accept": " application/json", "Content-Type": "application/json" } });
}


/**
 * 
 * @param instance 
 * @param itemId 
 * @param params 
 * @returns 
 */
export async function postPurchase(instance: RequestInstance, data: MarketPurchaseData) {
    return await onRequest<MarketPurchaseResponse>(instance, `/v1/meta/market/purchase`, { method: "POST", data, headers: { "accept": " application/json", "Content-Type": "application/json" } });
} 