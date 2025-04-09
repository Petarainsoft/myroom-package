import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { confirmPopupAtom } from '@/common/stores';

const useConfirmPopup = () => {
  const [confirmPopupData, setConfirmPopupData] = useAtom(confirmPopupAtom);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleCancel = () => {
    setIsOpen(false);
    setConfirmPopupData(null);
  };

  const handleConfirm = () => {
    if (confirmPopupData && confirmPopupData.onConfirm) {
      confirmPopupData.onConfirm();
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (confirmPopupData) {
      setIsOpen(true);
    } else setIsOpen(false);
  }, [confirmPopupData]);

  return { handleConfirm, handleCancel, isOpen };
};

export default useConfirmPopup;
