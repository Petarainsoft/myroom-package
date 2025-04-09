import { useAtomValue } from 'jotai';
import { confirmPopupAtom } from '@/common/stores';
import useConfirmPopup from '@/common/hooks/Popup/useConfirmPopup';
import ConfirmPopupCore from './ConfirmPopupCore';

const ConfirmPopup = () => {
  const confirmPopupData = useAtomValue(confirmPopupAtom);
  const { isOpen, handleConfirm, handleCancel } = useConfirmPopup();

  return (
    <ConfirmPopupCore
      isOpen={isOpen}
      cancelText={confirmPopupData?.cancelText}
      confirmText={confirmPopupData?.confirmText}
      titleText={confirmPopupData?.titleText}
      contentText={confirmPopupData?.contentText}
      handleCancel={handleCancel}
      handleConfirm={handleConfirm}
    />
  );
};

export default ConfirmPopup;
