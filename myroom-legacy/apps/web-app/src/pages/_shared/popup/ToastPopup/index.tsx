import { toastPopupAtom } from '@/common/stores';
import { useAtom } from 'jotai';
import './style.scss';
import ToastPopupCore from './ToastPopupComponent';

const TOAST_TIMEOUT_MS = 3000;

const ToastPopup = () => {
  const [toastPopupData, setToastPopupData] = useAtom(toastPopupAtom);
  if (!toastPopupData?.titleText) return <></>;

  return (
    <ToastPopupCore
      text={toastPopupData.titleText}
      setState={setToastPopupData}
      timeoutMs={TOAST_TIMEOUT_MS}
    />
  );
};

export default ToastPopup;
