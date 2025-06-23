import { useEffect } from 'react';
import useModal from '@/common/hooks/Modal/useModal';

const ScrapBookPage = () => {
  const ScrapBookFullScreenModal = useModal('ScrapBookFullScreenModal');

  useEffect(() => {
    ScrapBookFullScreenModal.createModal({});
    return () => ScrapBookFullScreenModal.deleteModal();
  }, []);

  return <></>;
};

export default ScrapBookPage;
