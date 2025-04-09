import { useEffect } from 'react';
import useModal from '@/common/hooks/Modal/useModal';

const ProfileAccountSettingPage = () => {
  const ProfileAccountSettingFullScreenModal = useModal(
    'ProfileAccountSettingFullScreenModal',
  );

  useEffect(() => {
    ProfileAccountSettingFullScreenModal.createModal({});
    return () => ProfileAccountSettingFullScreenModal.deleteModal();
  }, []);

  return <></>;
};

export default ProfileAccountSettingPage;
