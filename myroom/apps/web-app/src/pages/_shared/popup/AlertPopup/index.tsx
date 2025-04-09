import { useAtomValue } from 'jotai';
import useAlertPopup from '@/common/hooks/Popup/useAlertPopup';
import { alertPopupAtom } from '@/common/stores';
import PopupCore from '@/components/_core/PopupCore';
import SimplePopupContent from '../SimplePopupContent';
import AlertPopupCore from './AlertPopupCore';

const AlertPopup = () => {
  const alertPopupData = useAtomValue(alertPopupAtom);
  const { isOpen, handleConfirm } = useAlertPopup();

  return (
    <AlertPopupCore
      isOpen={isOpen}
      titleText={alertPopupData?.titleText}
      contentText={alertPopupData?.contentText}
      confirmText={alertPopupData?.confirmText}
      handleConfirm={handleConfirm}
    />
  );
};

export default AlertPopup;
