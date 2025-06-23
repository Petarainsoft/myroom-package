import useModal from '@/common/hooks/Modal/useModal';
import React, { useEffect } from 'react';

const FigureShowcase = () => {
  const FigureShowcaseModal = useModal('FigureShowcaseModal');

  useEffect(() => {
    FigureShowcaseModal.createModal({ isPage: true });
    return () => FigureShowcaseModal.deleteModal();
  }, []);

  return <></>;
};

export default FigureShowcase;
