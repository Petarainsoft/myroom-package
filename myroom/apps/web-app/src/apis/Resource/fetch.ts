import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  ResourceImageUploadData,
  ResourceImageUploadParams,
  ResourceVideoUploadData,
  ResourceVideoUploadParams,
} from './type';

/**
 *
 * @param instance
 * @param params
 * @param data
 * @returns
 */
export async function postResourceImage(
  instance: RequestInstance,
  data: ResourceImageUploadData,
  params?: ResourceImageUploadParams,
) {
  return await onRequest<any>(instance, `/v1/resource/images`, {
    method: 'POST',
    params,
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 *
 * @param instance
 * @param id
 * @param params
 * @returns
 */
export async function getResourceImageInfo(
  instance: RequestInstance,
  id: string,
) {
  return await onRequest(<any>instance, `/v1/resource/images/${id}/info`, {
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
 * @param params
 * @returns
 */
export async function getResourceVideoInfo(
  instance: RequestInstance,
  id: string,
) {
  return await onRequest<any>(instance, `/v1/resource/videos/${id}/info`, {
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
 * @param params
 * @param data
 * @returns
 */
export async function postResourceVideo(
  instance: RequestInstance,
  params: ResourceVideoUploadParams,
  data: ResourceVideoUploadData,
) {
  return await onRequest<any>(instance, `/v1/resource/videos`, {
    method: 'POST',
    params,
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'multipart/form-data',
    },
  });
}
