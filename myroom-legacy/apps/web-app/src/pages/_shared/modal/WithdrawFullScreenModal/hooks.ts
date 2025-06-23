import useMe from "@/common/hooks/use-me";
import useCash from "@/pages/Room_LEGACY/components/Cash/useCash";
import useUser from "@/pages/Search/Sub/User/hooks";
import { ChangeEvent, useCallback, useState } from "react";

const useWithdrawFullScreenModal = ()=>{
  const [checkedConfirm, setCheckedConfirm] = useState<boolean>(false);
  const [isAccountAuthentication, setIsAccountAuthentication] = useState<boolean>(false);
  const {hardCurrency, softCurrency} = useCash();
  const handleOnChangeConfirmCheckBox = useCallback((e:ChangeEvent<HTMLInputElement>)=>{
    if(!e.target)
      return;
    setCheckedConfirm(e.target.checked);
  },[]);
  const handleAccountAuthentication = useCallback(()=>{
    if(isAccountAuthentication)
      return;
    // TODO : 
    setIsAccountAuthentication(true);
  },[isAccountAuthentication]);
  const handleWithdraw = useCallback(async ()=>{
    console.log("handle withdraw - ")
  },[]);
  return {hardCurrency, softCurrency, checkedConfirm, isAccountAuthentication
    ,handleOnChangeConfirmCheckBox, handleAccountAuthentication, handleWithdraw};
};
export default useWithdrawFullScreenModal;