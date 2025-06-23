import { instance } from '@/common/utils/axios';
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { SessionGetParam } from "./type";
import { deleteMeSession, getMeSessions } from "./fetch";
import useAuth from "@/common/hooks/use-auth";

const useSessionAPI = ()=>{
  const { isLogined } = useAuth();
  /**
   * 세션 리스트 조회
   * 
   * @param params 
   * @returns 
   */
  const fetchMeSessions = (params: SessionGetParam) => {
    return useInfiniteQuery(
      [`fetchMeSession`, params.page, params.limit],
      async () => await getMeSessions(instance, params),
      {
        enabled: isLogined,
      }
    );
  };

  /**
   * 세션 삭제
   */
  const mutationDeleteMeSessions = useMutation(
    async (payload: { session_id: string }) =>
      await deleteMeSession(instance, payload.session_id),
  );
  return { fetchMeSessions, mutationDeleteMeSessions};
};
export default useSessionAPI;