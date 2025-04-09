import { CommonResponse } from '@/apis/_common/type';
import {
  ProfileAvailabilityParams,
  ProfileResponse,
  ProfileData,
  ProfileResourceType,
  ProfileSettingData,
  ProfileSettingResponse,
} from './type';
import onRequest, { RequestInstance } from '@/common/utils/fetch';

/**
 *
 * @param instance
 * @param data
 * @returns
 */
export async function postProfiles(
  instance: RequestInstance,
  data: ProfileData,
) {
  return await onRequest<ProfileResponse>(instance, `/v1/user/profiles`, {
    method: 'POST',
    data,
  });
}

/**
 *
 * @param instance
 * @param params
 * @returns
 */
export async function getProfilesAvailability(
  instance: RequestInstance,
  params: ProfileAvailabilityParams,
) {
  return await onRequest<CommonResponse>(
    instance,
    `/v1/user/profiles/availability`,
    { method: 'GET', params },
  );
}

/**
 *
 * @param instance
 * @param resource
 * @returns
 */
export async function getProfilesMeResource(
  instance: RequestInstance,
  resource?: ProfileResourceType,
) {
  return await onRequest<any>(instance, `/v1/user/profiles/me/${resource}`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @param id
 * @returns
 */
export async function getProfilesMeCount(instance: RequestInstance) {
  return await onRequest<any>(instance, `/v1/user/profiles/me/count`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @param id
 * @returns
 */
export async function getProfile(instance: RequestInstance, id?: string) {
  return await onRequest<ProfileResponse>(instance, `/v1/user/profiles/${id}`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @param id
 * @param data
 * @returns
 */
export async function postProfile(
  instance: RequestInstance,
  id: string,
  data: ProfileData,
) {
  return await onRequest<ProfileResponse>(instance, `/v1/user/profiles/${id}`, {
    method: 'POST',
    data,
  });
}

/**
 *
 * @param instance
 * @param id
 * @param resource
 * @returns
 */
export async function getProfileResource(
  instance: RequestInstance,
  id: string,
  resource: ProfileResourceType,
) {
  return await onRequest<any>(instance, `/v1/user/profiles/${id}/${resource}`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @param id
 * @returns
 */
export async function getProfileCount(instance: RequestInstance, id: string) {
  return await onRequest<any>(instance, `/v1/user/profiles/${id}/count`, {
    method: 'GET',
  });
}

/**
 *
 * @param instance
 * @returns
 */
export async function getProfileMeSetting(instance: RequestInstance) {
  return await onRequest<ProfileSettingResponse>(
    instance,
    `/v1/user/profiles/me/setting`,
    { method: 'GET' },
  );
}
/**
 *
 * @param instance
 * @param data
 * @returns
 */
export async function postProfileMeSetting(
  instance: RequestInstance,
  data: ProfileSettingData,
) {
  return await onRequest<ProfileResponse>(
    instance,
    `/v1/user/profiles/me/setting`,
    {
      method: 'POST',
      data,
    },
  );
}
