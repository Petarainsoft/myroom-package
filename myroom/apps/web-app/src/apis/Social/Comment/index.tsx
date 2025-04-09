import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import {
  getComment,
  getComments,
  postComments,
  patchComment,
  delComment,
} from './fetch';
import { CommentData, CommentsParams } from './type';

const useCommentAPI = () => {
  const queryClient = useQueryClient();

  const fetchCommentsQueryKey = (targetId?: string, parentId?: string) => {
    return ['fetchComments', targetId, parentId];
  };

  const refreshComments = async (targetId?: string, parentId?: string) => {
    await queryClient.invalidateQueries(
      fetchCommentsQueryKey(targetId, parentId),
    );
  };

  /**
   * 댓글 리스트
   * @param params
   * @returns
   */
  const fetchComments = (params: CommentsParams) => {
    return useInfiniteQuery({
      queryKey: fetchCommentsQueryKey(params.target_id, params.parent_id),
      queryFn: ({ pageParam }) =>
        getComments(instance, {
          end: pageParam?.end,
          //- 서버 성능 이슈로 한번만 호출할것
          total: pageParam?.disableTotalCount ? undefined : '1',
          ...params,
        }),
      getNextPageParam: (lastPage) => {
        // getNextPageParam: (lastPage, pages) => {
        if (lastPage && lastPage.count && lastPage.count.current > 0) {
          return {
            end: lastPage?.count?.start - 1,
            disableTotalCount: true,
          };
        } else {
          return undefined;
        }
      },
    });
  };

  /**
   * 댓글 생성
   */
  const mutationPostComments = useMutation(
    async (payload: { data: CommentData }) =>
      await postComments(instance, payload.data),
    {
      onSuccess: async (data, variables) => {
        console.log(data);
        const { target_id, parent_id } = variables.data;
        await queryClient.invalidateQueries(['fetchReaction', target_id]);
        await queryClient.invalidateQueries(
          fetchCommentsQueryKey(target_id, parent_id),
        );
        // queryClient.setQueryData(fetchCommentsQueryKey(target_id, parent_id),
        //   (old: any) =>
        //     produce(old, (draft: any) => {
        //       draft.pages[0].list.unshift({ ...data.data });
        //     }),
        // );
      },
    },
  );

  /**
   * 댓글 보기
   * @param id
   * @returns
   */
  const fetchComment = (id: string) => {
    return useQuery(
      [`fetchComment`, id],
      async () => await getComment(instance, id),
    );
  };

  /**
   * 댓글 수정
   */
  const mutationPatchComment = useMutation(
    async (payload: { id: string; data: CommentData }) =>
      await patchComment(instance, payload.id, payload.data),
    {
      onSuccess: async (data, variables) => {
        console.log(data);
        const { target_id, parent_id } = variables.data;
        await queryClient.invalidateQueries(
          fetchCommentsQueryKey(target_id, parent_id),
        );
        // queryClient.setQueryData(fetchCommentsQueryKey(target_id, parent_id),
        //   (old: any) =>
        //     produce(old, (draft: any) => {
        //       draft.pages.map((page: any, idx: number) => {
        //         console.log('pages', page.list);
        //         const index = page.list.findIndex(
        //           (x: any) => x._id === data.data._id,
        //         );

        //         if (index !== -1)
        //           draft.pages[idx].list[index].txt.contents =
        //             data.data.txt.contents;
        //       });
        //     }),
        // );
      },
    },
  );

  /**
   * 댓글 삭제
   */
  const mutationDelComment = useMutation(
    async (payload: { id: string; data: CommentData }) =>
      await delComment(instance, payload.id),
    {
      onSuccess: async (data, variables) => {
        console.log(data);
        const { target_id, parent_id } = variables.data;
        await queryClient.invalidateQueries(
          fetchCommentsQueryKey(target_id, parent_id),
        );
        await queryClient.invalidateQueries(['fetchReaction', target_id]);
        // queryClient.setQueryData(fetchCommentsQueryKey(target_id, parent_id),
        //   (old: any) =>
        //     produce(old, (draft: any) => {
        //       draft.pages.map((page: any, idx: number) => {
        //         const index = page.list.findIndex(
        //           (x: any) => x._id === data.data._id,
        //         );

        //         if (index !== -1) draft.pages[idx].list.splice(index, 1);
        //       });
        //     }),
        // );
      },
    },
  );

  return {
    fetchComments,
    refreshComments,
    mutationPostComments,
    fetchComment,
    mutationPatchComment,
    mutationDelComment,
  };
};

export default useCommentAPI;
