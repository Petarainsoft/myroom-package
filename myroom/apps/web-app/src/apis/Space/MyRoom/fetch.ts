import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  MyRoomData,
  MyRoomTemplateData,
  MyRoomDataResponse,
  MyRoomListResponse,
  CreateMyRoomData,
} from './type';
import { CommonResponse } from '@/apis/_common/type';

/**
 *
 * @param instance
 * @param data
 * @returns
 */
export async function postMyrooms(
  instance: RequestInstance,
  data: CreateMyRoomData,
) {
  return await onRequest<CommonResponse>(instance, `/v1/space/myrooms`, {
    method: 'POST',
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param myroomId
 * @param data
 * @returns
 */
export async function patchMyroom(
  instance: RequestInstance,
  myroomId: string,
  data: MyRoomData,
) {
  return await onRequest<CommonResponse>(
    instance,
    `/v1/space/myrooms/${myroomId}`,
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
 *
 * @param instance
 * @param myroomId
 * @returns
 */
export async function getMyroom(instance: RequestInstance, myroomId?: string) {
  return await onRequest<MyRoomDataResponse>(
    instance,
    `/v1/space/myrooms/${myroomId}`,
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
 * @returns
 */
export async function getMyroomsMe(instance: RequestInstance) {
  return await onRequest<MyRoomListResponse>(
    instance,
    `/v1/space/profiles/me/myrooms`,
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
 * @param myroomId
 * @param version
 * @returns
 */
export async function getMyroomManifest(
  instance: RequestInstance,
  myroomId?: string,
  version?: number,
) {
  return await onRequest<MyRoomData>(
    instance,
    `/v1/space/myrooms/${myroomId}/${version}/manifest`,
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
 * @param myroomId
 * @param data
 * @returns
 */
export async function postMyroomTemplates(
  instance: RequestInstance,
  myroomId: string,
  data: MyRoomTemplateData,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates`,
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

/**
 *
 * @param instance
 * @returns
 */
export async function getMyroomTemplates(
  instance: RequestInstance,
  myroomId?: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates`,
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
 * @param myroomId
 * @param data
 * @returns
 */
export async function delMyroomTemplate(
  instance: RequestInstance,
  myroomId: string,
  templateId: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates/${templateId}`,
    {
      method: 'DELETE',
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
 * @param myroomId
 * @param templateId
 * @returns
 */
export async function getMyroomTemplateManifest(
  instance: RequestInstance,
  myroomId: string,
  templateId: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates/${templateId}/manifest`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
