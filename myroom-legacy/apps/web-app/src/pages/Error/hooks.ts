
import useAuth from "@/common/hooks/use-auth";
import { uiSignInSheetAtom, uiSignInSheetDimmedAtom } from "@/common/stores";
import { logger } from "@/common/utils/logger";
import { t } from 'i18next';
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
enum RedirectType {
  Default = 0,
  RecommendPing,
  Retry,
  MyRoom,
}
type RedirectData = {
  to : string|number,
  textId : string
}
const RedirectTo : RedirectData[] = [];
RedirectTo[RedirectType.Retry] = {to : -1, textId:"다시 시도"};
RedirectTo[RedirectType.RecommendPing] = {to : "rooms/me", textId:"PING으로 가기"};
RedirectTo[RedirectType.MyRoom] = {to : "rooms/me", textId:"마이룸으로 가기"};
RedirectTo[RedirectType.Default] = RedirectTo[RedirectType.RecommendPing]
type CustomError = {
  data:{
    textId?:string;
  },
  status?: number;
  statusText?:string;
}
const isCustomError = (res:any) : res is CustomError =>{
  return res?.status;
}

const useError = ()=>{
  const error = useRouteError();
  const navigate = useNavigate();
  // logger.log("!!!!!!!!!!!!!!!!!!!!!!!!!! error !!!!!!!!!!!!!!!!!!! isRouteError ? ", isRouteErrorResponse(error), " ??? ", error);
  const {isLogined} = useAuth();
  const setUISignInSheet = useSetAtom(uiSignInSheetAtom);
  const setUISignInSheetDimmed = useSetAtom(uiSignInSheetDimmedAtom);
  
  if(!isLogined){
    setUISignInSheetDimmed(false);
  }
  setUISignInSheet(!isLogined);
    
  
  let errorMsg = (error as any).toString();
  let redirectType = RedirectType.Default;
  let redirectData : RedirectData = RedirectTo[redirectType];
  
  if(isCustomError(error)){
    errorMsg = `${error.status} ${error.data?.textId?t(error.data.textId):error.statusText}`;
    switch(error.status){
      default : 
      redirectType = RedirectType.Default;
      redirectData = RedirectTo[RedirectType.Default];
    }
  }
  const handleRedirect = useCallback(()=>{
    if(redirectType == RedirectType.Retry){
      location.reload();
      return;
    }
    if(typeof(redirectData.to) === "string")
      navigate(redirectData.to);
    else
      navigate(redirectData.to);
    setUISignInSheetDimmed(true);
  }, [redirectType, redirectData]);

  return {errorMsg, redirectData, handleRedirect}
};

export default useError;