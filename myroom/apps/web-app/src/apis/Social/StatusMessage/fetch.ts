import onRequest, { RequestInstance } from '@/common/utils/fetch';
import { StatusMessageData, StatusMessagesParams } from './type';

/**
 * 상태 메시지 삭제하기
 * @param instance
 * @param id
 * @returns
 */

export async function delStatusMessage(instance: RequestInstance, id: string) {
  return await onRequest<any>(instance, `/v1/social/status-messages/${id}`, {
    method: 'DELETE',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * 상태메시지 리스트
 * @param instance
 * @param params
 * @returns
 */

export async function getStatusMessages(
  instance: RequestInstance,
  params: StatusMessagesParams,
) {
  return await onRequest<any>(
    instance,
    `/v1/social/profiles/${params.profile_id}/status-messages`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 * 상태 메시지 생성하기
 * @param instance
 * @param data
 * @returns
 */
export async function postStatusMessages(
  instance: RequestInstance,
  data: StatusMessageData,
) {
  return await onRequest<any>(instance, `/v1/social/status-messages`, {
    method: 'POST',
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * 상태 메시지 상세 정보
 * @param instance
 * @param id
 * @returns
 */
export async function getStatusMessage(instance: RequestInstance, id: string) {
  return await onRequest<any>(instance, `/v1/social/status-messages/${id}`, {
    method: 'GET',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}
