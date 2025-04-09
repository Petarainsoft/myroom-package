import { useNavigate, useSearchParams } from 'react-router-dom';
import { signIn, signOut } from '@colorverse/auth';
import { auth } from '@/common/utils/auth';
import React from 'react';
// import useUserAPI from '@/apis/User/User';
// import useMyRoomAPI from '@/apis/Space/MyRoom';
import useAuth from '@/common/hooks/use-auth';
import useMe from '@/common/hooks/use-me';

const _Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signin, signout, isLogined } = useAuth();
  const { checkSignup } = useMe();

  const authorize = async () => {
    const code = searchParams.get('code');
    if (code) {
      const success = await signIn(auth, {
        code: decodeURIComponent(code),
        codeVerifier: '123',
        clientId: auth.config.apiKey,
        grantType: 'code',
        requestUri: 'https://myroom.develop.colorver.se/auth/_callback',
      });

      if (success) {
        signin();
        return;
      } else {
        signout();
      }
    }

    signOut(auth);
    signout();
    navigate('/auth/signin', { replace: true });
  };

  React.useLayoutEffect(() => {
    authorize();
  }, []);

  const checkWithRedirect = async () => {
    const status = await checkSignup();
    if (status === 'USER') {
      navigate('/rooms/me');
    } else if (status === 'UNSIGNUP') {
      navigate('/auth/signup');
    } else {
      return;
    }
  };

  React.useEffect(() => {
    checkWithRedirect();
  }, [isLogined]);

  return <>AUTH</>;
};

export default _Callback;
