import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  BalloonPatchParam,
  BalloonPostParam,
  BalloonsGetParam,
  GetBalloonDataResponse,
  GetBalloonsResponse,
  GetMeFreeBalloonResponse,
  PatchBalloonsResponse,
  PostBalloonsResponse,
} from './type';

/**
 * 풍선 리스트 조회.
 * @param instance
 * @param params
 * @returns
 */
export async function getBalloons(
  instance: RequestInstance,
  profile_id: string,
  params: BalloonsGetParam,
) {
  return await onRequest<GetBalloonsResponse>(
    instance,
    `/v1/social/profiles/${profile_id}/balloons`,
    {
      method: 'GET',
      params,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      mock: false,
    },
  );
}
/**
 * 풍선 상세정보 조회.
 */
export async function getBalloonDataId(
  instance: RequestInstance,
  balloon_id: string,
) {
  return await onRequest<GetBalloonDataResponse>(
    instance,
    `/v1/social/balloons/${balloon_id}`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      mock: false,
    },
  );
}

/**
 * 풍선 작성.
 * @param instance
 * @param data
 * @returns
 */
export async function postBalloons(
  instance: RequestInstance,
  data: BalloonPostParam,
) {
  return await onRequest<PostBalloonsResponse>(
    instance,
    `/v1/social/balloons`,
    {
      method: 'POST',
      data,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      mock: false,
    },
  );
}
/**
 * 풍선 상태 변경.
 * @param instance
 * @param id
 * @returns
 */
export async function patchBalloon(
  instance: RequestInstance,
  data: BalloonPatchParam,
) {
  return await onRequest<PatchBalloonsResponse>(
    instance,
    `/v1/social/balloons`,
    {
      method: 'PATCH',
      data,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 * 당일 무료 풍선 사용 횟수 조회.
 * @param instance
 * @returns
 */
export async function getMeFreeBalloon(instance: RequestInstance) {
  return await onRequest<GetMeFreeBalloonResponse>(
    instance,
    `/v1/social/profiles/me/states/free-balloon`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
