import { AuthRefreshParams, AuthSignupEmailData, AuthEmailParams, AuthSignupEmailResponse, AuthRefreshResponse, AuthSigninEmailData, AuthSigninEmailResponse } from "./type";
import onRequest, { RequestInstance } from "@/common/utils/fetch";


/**
 * 
 * @param instance 
 * @param params 
 * @returns 
 */
export async function postAuthRefesh(instance: RequestInstance, refreshToken: string, params: AuthRefreshParams) {
    return await onRequest<AuthRefreshResponse>(instance, `/v1/auth/refresh`, { method: "POST", data: refreshToken, params });
}

/**
 * 
 * @param instance 
 * @param data 
 * @param params 
 * @returns 
 */
export async function postAuthSignupEmail(instance: RequestInstance, data: AuthSignupEmailData, params?: AuthEmailParams) {
    return await onRequest<AuthSignupEmailResponse>(instance, `/v1/auth/signup/email`, { method: "POST", data, params, headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * 
 * @param instance 
 * @param data 
 * @param params 
 * @returns 
 */
export async function postAuthSigninEmail(instance: RequestInstance, data: AuthSigninEmailData, params?: AuthEmailParams) {
    return await onRequest<AuthSigninEmailResponse>(instance, `/v1/auth/signin/email`, { method: "POST", data, params, headers: { "accept": " application/json", "Content-Type": "application/json" }});
}



