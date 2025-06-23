import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { alertPopupAtom } from '@/common/stores';

const useAlertPopup = () => {
  const [alertPopupData, setAlertPopupData] = useAtom(alertPopupAtom);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleConfirm = () => {
    setIsOpen(false);
    setAlertPopupData(null);
  };

  useEffect(() => {
    if (alertPopupData) {
      setIsOpen(true);
    } else setIsOpen(false);
  }, [alertPopupData]);

  return { handleConfirm, isOpen };
};

export default useAlertPopup;
