import { uiProfileAtom } from '@/common/stores';
import { useAtom } from 'jotai';
import ProfileOffCanvas from './ProfileOffCanvas';

const ProfileUI = () => {
  const [uiProfile] = useAtom(uiProfileAtom);
  return <>{uiProfile.isVisible && <ProfileOffCanvas />}</>;
};

export default ProfileUI;
