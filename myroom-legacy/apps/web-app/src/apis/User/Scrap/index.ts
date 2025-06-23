import { instance } from '@/common/utils/axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getScrapFoldersMe,
  getScrapFoldersWhere,
  postScrapFoldersMe as createScrapFoldersMe,
  modifyScrapFoldersMe,
  deleteScrapFoldersMe,
  getScrapFolderContents,
  putScrapFolderContent,
  deleteScrapFolderContent,
} from './fetch';
import useAuth from '@/common/hooks/use-auth';
import { PostScrapFoldersData } from './type';

const useScrapAPI = () => {
  // const queryClient = useQueryClient();
  const { isLogined } = useAuth();
  /**
   * 스크랩 폴더 리스트 조회.
   * @returns
   */
  const fetchScrapFoldersMe = () => {
    return useQuery(
      [`fetchScrapFoldersMe`],
      async () => await getScrapFoldersMe(instance),
      { enabled: isLogined },
    );
  };
  /**
   * 스크랩 폴더 생성.
   */
  const mutationCreateScrapFoldersMe = useMutation(
    async (payload: { data: PostScrapFoldersData }) =>
      await createScrapFoldersMe(instance, payload.data),
  );
  /**
   * 스크랩 ContentID 로 폴더 위치 찾기.
   */
  const fetchScrapFoldersWhere = (content_id: string) => {
    return useQuery(
      [`fetchScrapFoldersWhere_${content_id}`],
      async () => await getScrapFoldersWhere(instance, content_id),
      { enabled: isLogined },
    );
  };
  /**
   * 스크랩 폴더 메타 수정.
   */
  const mutationModifyScrapFolder = useMutation(
    async (payload: { data: PostScrapFoldersData }) =>
      await modifyScrapFoldersMe(instance, payload.data),
  );

  /**
   * 스크랩 폴더 삭제.
   */
  const mutationDeleteScrapFolderMe = useMutation(
    async (payload: { folder_id: string }) =>
      await deleteScrapFoldersMe(instance, payload.folder_id),
  );

  /**
   * 스크랩 폴더 컨텐츠 리스트 조회.
   */
  const mutationScrapFolderContents = useMutation(
    async (payload: { folder_id: string }) =>
      await getScrapFolderContents(instance, payload.folder_id),
  );
  const fetchScrapFolderContents = (folder_id: string) => {
    return useQuery(
      [`fetchScrapFoldersContents_${folder_id}`],
      async () => await getScrapFolderContents(instance, folder_id),
      { enabled: isLogined && folder_id !== '' },
    );
  };

  /**
   * 스크랩 폴더에 컨텐츠 추가.
   */
  const mutationPutScrapFolderContent = useMutation(
    async (payload: { folder_id: string; content_id: string }) =>
      await putScrapFolderContent(
        instance,
        payload.folder_id,
        payload.content_id,
      ),
  );

  /**
   * 스크랩 폴더에 컨텐츠 삭제.
   */
  const mutationDeleteScrapFolderContent = useMutation(
    async (payload: { folder_id: string; content_id: string }) =>
      await deleteScrapFolderContent(
        instance,
        payload.folder_id,
        payload.content_id,
      ),
  );

  return {
    fetchScrapFoldersMe,
    mutationCreateScrapFoldersMe,
    fetchScrapFoldersWhere,
    mutationModifyScrapFolder,
    mutationDeleteScrapFolderMe,
    mutationScrapFolderContents,
    fetchScrapFolderContents,
    mutationPutScrapFolderContent,
    mutationDeleteScrapFolderContent,
  };
};

export default useScrapAPI;
