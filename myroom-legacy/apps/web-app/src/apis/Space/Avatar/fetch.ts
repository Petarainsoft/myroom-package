import onRequest, { RequestInstance } from "@/common/utils/fetch";
import { AvatarReqData, AvatarsMeResponse, AvatarsResponse, } from "./type";



/**
 * 
 * @param instance 
 * @param data 
 * @returns 
 */
export async function postAvatars(instance: RequestInstance, data: AvatarReqData) {
    return await onRequest<AvatarsResponse>(instance, `/v1/space/avatars`, { method: "POST", data, headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * 
 * @param instance 
 * @param avatarId 
 * @param data 
 * @returns 
 */
export async function patchAvatar(instance: RequestInstance, avatarId: string, data: AvatarReqData) {
    return await onRequest<AvatarsResponse>(instance, `/v1/space/avatars/${avatarId}`, { method: "PATCH", data, headers: { "accept": " application/json", "Content-Type": "application/json" } });
}


/**
 * 
 * @param instance 
 * @param avatarId 
 * @returns 
 */
export async function getAvatar(instance: RequestInstance, avatarId?: string) {
    return fakeAvatarsResponse;
    return await onRequest<AvatarsResponse>(instance, `/v1/space/avatars/${avatarId}`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * 
 * @param instance 
 * @returns 
 */
export async function getAvatarsMe(instance: RequestInstance) {
    return await onRequest<AvatarsMeResponse>(instance, `/v1/space/profiles/me/avatars`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * 
 * @param instance 
 * @param avatarId 
 * @param version 
 * @returns 
 */
export async function getAvatarManifest(instance: RequestInstance, avatarId?: string, version?: number) {
    return await onRequest<any>(instance, `/v1/space/avatars/${avatarId}/${version}/manifest`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
} 

const fakeAvatarsResponse: AvatarsResponse = {
    // code: 200,
    // message: "Avatar fetched successfully",
    data: {
      _id: "1",
      profile_id: "1",
      resource: {
        manifest: "https://cdn.example.com/avatars/avatar_123456/manifest.json"
      },
      option: {
        version: 3
      },
      stat: {
        created: 1713168000000, // 2024-04-15T00:00:00Z
        updated: 1713240000000  // 2024-04-16T00:00:00Z
      }
    }
  };