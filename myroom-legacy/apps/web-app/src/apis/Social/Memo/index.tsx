import { useMutation, useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { getMemos, posttMemos, getMemo, postMemo, delMemo } from './fetch';
import { MemosParams, MemoData } from './type';

const useMemoAPI = () => {
  /**
   * 메모 리스트
   * @param params
   * @returns
   */
  const fetchMemos = (params: MemosParams) => {
    return useQuery(
      [`fetchMemos`, params],
      async () => await getMemos(instance, params),
    );
  };

  /**
   * 메모 작성
   */
  const mutationPostMemos = useMutation(
    async (payload: { data: MemoData }) =>
      await posttMemos(instance, payload.data),
  );

  /**
   * 메모 정보
   * @param id
   * @returns
   */
  const fetchMemo = (id?: string) => {
    return useQuery([`fetchMemo`, id], async () => await getMemo(instance, id));
  };

  /**
   * 메모 수정
   */
  const mutationPostMemo = useMutation(
    async (payload: { id: string; data: MemoData }) =>
      await postMemo(instance, payload.id, payload.data),
  );

  /**
   * 메모 삭제
   */
  const mutationDelMemo = useMutation(
    async (payload: { id: string }) => await delMemo(instance, payload.id),
  );

  return {
    fetchMemos,
    fetchMemo,
    mutationPostMemos,
    mutationPostMemo,
    mutationDelMemo,
  };
};

export default useMemoAPI;
