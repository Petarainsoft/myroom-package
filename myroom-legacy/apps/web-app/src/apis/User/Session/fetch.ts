import onRequest, { RequestInstance } from "@/common/utils/fetch";
import { SessionGetParam, SessionResponse } from "./type";
import { CommonResponse } from "@/apis/_common/type";

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getMeSessions(instance: RequestInstance, params: SessionGetParam) {
  return await onRequest<SessionResponse>(instance, `/v1/user/users/me/sessions`, {
    method: 'GET',
    params,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}
export async function deleteMeSession(instance:RequestInstance, session_id:string){
  return await onRequest<CommonResponse>(instance, `/v1/user/users/me/sessions/${session_id}`, {
    method: 'DELETE',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}