import useSessionAPI from "@/apis/User/Session";
import { SessionData } from "@/apis/User/Session/type";
import usePopup from "@/common/hooks/Popup/usePopup";
import { useCallback, useMemo } from "react";

const useSessionListFullScreenModal = ()=>{
  const {showConfirmPopup} = usePopup();
  
  const { fetchMeSessions, mutationDeleteMeSessions} = useSessionAPI();
  const {data:sessionRes, isSuccess:isSuccessMeSession, fetchNextPage:fetchNextMeSession, hasNextPage:hasNextPageMeSession} = fetchMeSessions({page:1, limit:15});

  const sessionList = useMemo(()=>{
    if(isSuccessMeSession)
      return sessionRes?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []) as SessionData[];
  }, [sessionRes, isSuccessMeSession]);
  
  const handleAllLogout = useCallback(()=>{
    showConfirmPopup({titleText:'모든 브라우저에서 로그아웃 하시겠습니까?', confirmText:'로그아웃', cancelText:'취소', onConfirm:()=>{
      console.log('all logout confirm.');
      // TODO : current session pass. 
    }});
  },[]);
  // const logoutSession = async (session_id:string)=>{
  //   return await mutationDeleteMeSessions.mutateAsync({session_id:session_id});
  // };
  return {sessionList,hasNextPageMeSession, handleAllLogout};
};

export default useSessionListFullScreenModal;