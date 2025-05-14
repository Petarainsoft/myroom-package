import { isSignedInAtom } from '@/common/stores';
import { useAtom } from 'jotai';

const useAuth = () => {
  const [isLogined, setIsLogined] = useAtom(isSignedInAtom);

  const signin = () => {
    setIsLogined(true);

    // Repository.init().then(() => { }).catch(() => { });
  };

  const signout = () => {
    setIsLogined(false);
  };

  return { isLogined, signin, signout };
};

export default useAuth;
