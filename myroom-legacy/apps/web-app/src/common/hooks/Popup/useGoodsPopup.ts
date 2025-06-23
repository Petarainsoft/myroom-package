import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { goodsPopupAtom } from '@/common/stores';

const useGoodsPopup = () => {
  const [goodsPopupData, setGoodsPopupData] = useAtom(goodsPopupAtom);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleCancel = () => {
    setIsOpen(false);
    setGoodsPopupData(null);
  };

  const handleConfirm = () => {
    if (goodsPopupData && goodsPopupData.onConfirm) {
      goodsPopupData.onConfirm();
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (goodsPopupData) {
      setIsOpen(true);
    } else setIsOpen(false);
  }, [goodsPopupData]);

  return { handleConfirm, handleCancel, isOpen };
};

export default useGoodsPopup;
