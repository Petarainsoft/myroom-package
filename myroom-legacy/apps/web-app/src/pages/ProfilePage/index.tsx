import { useEffect } from 'react';
import useModal from '@/common/hooks/Modal/useModal';

const ProfilePage = () => {
  const ProfileFullScreenModal = useModal('ProfileFullScreenModal');

  useEffect(() => {
    ProfileFullScreenModal.createModal({ isPage: true });
    return () => ProfileFullScreenModal.deleteModal();
  }, []);

  return <></>;
};

export default ProfilePage;
