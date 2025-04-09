import { useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  ResourceImageUploadData,
  ResourceImageUploadParams,
  ResourceVideoUploadData,
  ResourceVideoUploadParams,
} from './type';
import {
  getResourceImageInfo,
  getResourceVideoInfo,
  postResourceImage,
  postResourceVideo,
} from './fetch';

const useResourceAPI = () => {
  /**
   * 이미지 업로드
   */
  const mutationPostResourceImage = useMutation(
    async (payload: {
      params: ResourceImageUploadParams;
      data: ResourceImageUploadData;
    }) => await postResourceImage(instance, payload.data, payload.params),
  );

  /**
   * 이미지 정보
   * @param id
   * @returns
   */
  const fetchResourceImageInfo = (id: string) => {
    return useQuery(
      [`fetchResourceImageInfo`, id],
      async () => await getResourceImageInfo(instance, id),
    );
  };

  /**
   * 동영상 업로드
   */
  const mutationPostResourceVideo = useMutation(
    async (payload: {
      params: ResourceVideoUploadParams;
      data: ResourceVideoUploadData;
    }) => await postResourceVideo(instance, payload.params, payload.data),
  );

  /**
   * 동영상 정보
   * @param id
   * @returns
   */
  const fetchResourceVideoInfo = (id: string) => {
    return useQuery(
      [`fetchResourceVideoInfo`, id],
      async () => await getResourceVideoInfo(instance, id),
    );
  };

  return {
    mutationPostResourceImage,
    fetchResourceImageInfo,
    mutationPostResourceVideo,
    fetchResourceVideoInfo,
  };
};

export default useResourceAPI;
