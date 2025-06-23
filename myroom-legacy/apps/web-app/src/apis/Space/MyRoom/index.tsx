import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  delMyroomTemplate,
  getMyroom,
  getMyroomManifest,
  getMyroomTemplateManifest,
  getMyroomTemplates,
  getMyroomsMe,
  patchMyroom,
  postMyroomTemplates,
  postMyrooms,
} from './fetch';
import { CreateMyRoomData, MyRoomData, MyRoomTemplateData } from './type';
import useAuth from '@/common/hooks/use-auth';

const useMyRoomAPI = () => {
  const queryClient = useQueryClient();

  const { isLogined } = useAuth();
  /**
   * 마이룸 추가
   */
  const mutationPostMyrooms = useMutation(
    async (payload: { data: CreateMyRoomData }) =>
      await postMyrooms(instance, payload.data),
  );

  /**
   * 마이룸 수정
   */
  const mutationPatchMyroom = useMutation(
    async (payload: { id: string; data: MyRoomData }) =>
      await patchMyroom(instance, payload.id, payload.data),
  );

  /**
   * 마이룸 조회
   * @param id
   * @returns
   */
  const fetchMyroom = (
    id?: string,
    // option?: Object
  ) => {
    return useQuery(
      [`fetchMyroom`, id],
      async () => await getMyroom(instance, id),
      { enabled: !!id },
    );
  };

  /**
   * 내 마이룸 리스트
   * @returns
   */
  const mutationMyroomsMe = useMutation(
    async () => await getMyroomsMe(instance),
  );

  /**
   * 내 마이룸 리스트
   * @returns
   */
  const fetchMyroomsMe = () => {
    return useQuery(
      [`fetchMyroomsMe`],
      async () => await getMyroomsMe(instance),
      { enabled: isLogined },
    );
  };

  /**
   *
   * @param id
   * @param version
   * @returns
   */
  const fetchMyroomManifest = (id?: string, version?: number) => {
    return useQuery(
      [`fetchMyroomManifest`, id, version],
      async () => await getMyroomManifest(instance, id, version),
      { enabled: !!id },
    );
  };

  /**
   * 마이룸 템플릿 추가
   */
  const mutationPostMyroomTemplate = useMutation(
    async (payload: { id: string; data: MyRoomTemplateData }) =>
      await postMyroomTemplates(instance, payload.id, payload.data),
    {
      onSuccess: async (data: any, variables) => {
        await queryClient.invalidateQueries([
          `fetchMyroomTemplates`,
          variables.id,
        ]);
      },
    },
  );

  /**
   * 마이룸 템플릿 리스트
   * @param id
   * @returns
   */
  const fetchMyroomTemplates = (id?: string) => {
    return useQuery(
      [`fetchMyroomTemplates`, id],
      async () => await getMyroomTemplates(instance, id),
      {
        enabled: !!id,
      },
    );
  };

  /**
   * 마이룸 템플릿 삭제
   */
  const mutationDelMyroomTemplate = useMutation(
    async (payload: { id: string; templateId: string }) =>
      await delMyroomTemplate(instance, payload.id, payload.templateId),
    {
      onSuccess: async (data: any, variables) => {
        await queryClient.invalidateQueries([
          `fetchMyroomTemplates`,
          variables.id,
        ]);
      },
    },
  );

  /**
   *
   * @param id
   * @param templateId
   * @returns
   */
  const fetchMyroomTemplateManifest = (id: string, templateId: string) => {
    return useQuery(
      [`fetchMyroomTemplateManifest`, id, templateId],
      async () => await getMyroomTemplateManifest(instance, id, templateId),
    );
  };

  /**
   *
   */
  const mutationFetchMyroomTemplate = useMutation(
    async (payload: { id: string; templateId: string }) =>
      await getMyroomTemplateManifest(instance, payload.id, payload.templateId),
  );

  return {
    mutationPostMyrooms,
    mutationPatchMyroom,
    fetchMyroom,
    fetchMyroomsMe,
    mutationMyroomsMe,
    fetchMyroomManifest,
    mutationPostMyroomTemplate,
    fetchMyroomTemplates,
    mutationDelMyroomTemplate,
    fetchMyroomTemplateManifest,
    mutationFetchMyroomTemplate,
  };
};

export default useMyRoomAPI;
