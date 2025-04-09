import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  ReactionParams,
  MeReactionsParams,
  ReactionPostRes,
  MyReactionsRes,
  MyReactionsByTypeRes,
} from './type';


/**
 *
 * @param instance
 * @param targetId
 * @returns
 */
export async function getMyReactions(
  instance: RequestInstance,
  params?: MeReactionsParams,
) {
  return await onRequest<MyReactionsByTypeRes>(
    instance,
    `/v1/social/profiles/me/reactions`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      params
    },
  );
}


/**
 *
 * @param instance
 * @param targetId
 * @returns
 */
export async function getMyReactionByType(
  instance: RequestInstance,
  targetType?: string,
) {
  return await onRequest<MyReactionsByTypeRes>(
    instance,
    `/v1/social/profiles/me/reactions`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
      params: {
        target_type: targetType
      }
    },
  );
}


/**
 *
 * @param instance
 * @param targetId
 * @returns
 */
export async function getMyReaction(
  instance: RequestInstance,
  targetId?: string,
) {
  return await onRequest<MyReactionsRes>(
    instance,
    `/v1/social/profiles/me/reactions/${targetId}`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @param targetId
 * @returns
 * GET /v1/social/reactions/{target_id} 타겟의 리액션 정보
 */
export async function getReaction(instance: RequestInstance, targetId: string) {
  return await onRequest<any>(instance, `/v1/social/reactions/${targetId}`, {
    method: 'GET',
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param targetId
 * @param params
 * @returns
 * POST /v1/social/reactions/{target_id} 리액션 토글
 */
export async function postReaction(
  instance: RequestInstance,
  targetId: string,
  data: ReactionParams,
) {
  return await onRequest<ReactionPostRes>(
    instance,
    `/v1/social/reactions/${targetId}`,
    {
      method: 'POST',
      data,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

// /**
//  *
//  * @param instance
//  * @param targetId
//  * @param params
//  * @returns
//  */
// export async function getReactionProfile(
//   instance: RequestInstance,
//   targetId: string,
//   params: ReactionProfileParams,
// ) {
//   return await onRequest<any>(
//     instance,
//     `/v1/social/reactions/${targetId}/profile`,
//     {
//       method: 'GET',
//       params,
//       headers: {
//         accept: ' application/json',
//         'Content-Type': 'application/json',
//       },
//     },
//   );
// }
