import { useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getProfile,
  getProfileResource,
  getProfilesAvailability,
  getProfilesMeResource,
  postProfile,
  postProfiles,
  getProfilesMeCount,
  getProfileCount,
  getProfileMeSetting,
  postProfileMeSetting,
} from './fetch';
import { ProfileData, ProfileResourceType, ProfileSettingData } from './type';
import useAuth from '@/common/hooks/use-auth';

const useProfileAPI = () => {
  const { isLogined } = useAuth();
  /**
   * 프로필 생성하기
   */
  const mutationPostProfiles = useMutation(
    async (payload: { data: ProfileData }) =>
      await postProfiles(instance, payload.data),
  );

  /**
   * 프로필 항목 유효성 검사(사용편의상 useQuery -> useMutation)
   * @param name
   * @returns
   */
  const mutationProfilesAvailability = useMutation(
    async (payload: { name: string }) =>
      await getProfilesAvailability(instance, { name: payload.name }),
  );

  /**
   * 나의 프로필 리소스 가져오기
   * @param resource
   * @returns
   */
  const useFetchProfilesMeResource = (resource: ProfileResourceType) => {
    return useQuery(
      [`fetchProfilesMeResource`, resource],
      async () => await getProfilesMeResource(instance, resource),
    );
  };

  /**
   * 프로필 가져오기
   * @param profileId
   * @returns
   */
  const useFetchProfile = (profileId?: string) => {
    return useQuery(
      [`fetchProfile`, profileId],
      async () => await getProfile(instance, profileId),
      { enabled: !!profileId },
    );
  };

    /**
   * 프로필 가져오기
   * @param profileId
   * @returns
   */
    const mutationFetchProfile = useMutation(
      async (payload: { profileId?: string;}) =>
        await getProfile(instance, payload.profileId),
    );

  /**
   * 프로필 수정하기
   */
  const mutationPostProfile = useMutation(
    async (payload: { profileId: string; data: ProfileData }) =>
      await postProfile(instance, payload.profileId, payload.data),
  );

  /**
   * 프로필 리소스 가져오기
   * @param profileId
   * @param resource
   * @returns
   */
  const useFetchProfileResource = (
    profileId: string,
    resource: ProfileResourceType,
  ) => {
    return useQuery(
      ['fetchProfileResource', profileId, resource],
      async () => await getProfileResource(instance, profileId, resource),
    );
  };

  const fetchProfilesMeCount = () => {
    return useQuery(
      ['fetchProfilesMeCount'],
      async () => await getProfilesMeCount(instance),
      { enabled: isLogined },
    );
  };

  const fetchProfileCount = (profileId: string) => {
    return useQuery(
      ['fetchProfileCount', profileId],
      async () => await getProfileCount(instance, profileId),
      { enabled: isLogined },
    );
  };
  const fetchProfileMeSetting = () => {
    return useQuery(
      ['fetchProfileMeSetting'],
      async () => await getProfileMeSetting(instance),
      { enabled: isLogined },
    );
  };
  /**
   * 프로필 setting.
   */
  const mutationPostProfileMeSetting = useMutation(
    async (payload: { data: ProfileSettingData }) =>
      await postProfileMeSetting(instance, payload.data),
  );

  return {
    mutationPostProfiles,
    mutationProfilesAvailability,
    fetchProfilesMeResource: useFetchProfilesMeResource,
    fetchProfile: useFetchProfile,
    mutationPostProfile,
    fetchProfileResource: useFetchProfileResource,
    fetchProfileCount,
    fetchProfilesMeCount,
    fetchProfileMeSetting,
    mutationPostProfileMeSetting,
    mutationFetchProfile,
  };
};

export default useProfileAPI;
