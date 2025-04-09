// import useMyRoomAPI from "@/apis/Space/MyRoom";
import useAuthAPI from '@/apis/User/Auth';
import useUserAPI from '@/apis/User/User';
import useAuth from '@/common/hooks/use-auth';
import { auth } from '@/common/utils/auth';
import React, { useCallback } from 'react';
import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useTestSignin = () => {
  const { signin, isLogined } = useAuth();
  const { mutationPostAuthSignupEmail, mutationPostAuthSigninEmail } =
    useAuthAPI();
  const { mutationUsersMe } = useUserAPI();
  const navigate = useNavigate();
  const [id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSwagger, setIsSwagger] = useState(false);
  const [message, setMessage] = useState<string>();

  

  React.useEffect(() => {
    if (!isLogined) {
      return;
    }
    navigate('/auth/signin');
  }, [isLogined]);

  const handleClickBack = useCallback(() => { 
    navigate(-1);
  },[navigate]);

  /**
   * 로그인 처리
   */
  const signinCredential = React.useCallback(
    (credential: any) => {
      const { access_token, expires, refresh_token, token_type } = credential;
      auth.setCredential({
        accessToken: access_token,
        expires: expires,
        refreshToken: refresh_token,
        tokenType: token_type,
      });

      if (isSwagger) {
        window.open('', '_blank');
      }

      signin();
    },
    [isSwagger],
  );

  /**
   * id 변경 핸들러
   * @param e
   */
  const handleChangeId = (e: ChangeEvent<HTMLInputElement>) => {
    setId(e.currentTarget.value);
  };

  /**
   * 패드워드 변경 핸들러
   * @param e
   */
  const handleChangePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.currentTarget.value);
  };

  /**
   * 스웨거 on/off 핸들러
   * @param e
   */
  const handleChangeCheckBox = (e: ChangeEvent<HTMLInputElement>) => {
    setIsSwagger(e.currentTarget.checked);
  };

  /**
   * 유효성 검사
   * @returns
   */
  const validation = () => {
    if (!id || !password) {
      setMessage('id, password를 확인해주세요.');
      return false;
    }

    return true;
  };

  /**
   * 로그인 핸들러
   * @returns
   */
  const handleClickSignin = async () => {
    if (!validation()) {
      return;
    }

    const res = await mutationPostAuthSigninEmail.mutateAsync({
      data: {
        id,
        password,
      },
      params: {
        p: '',
        w: '',
      },
    });

    if (res) {
      signinCredential(res.credential);
    }
  };
  /**
   *  회원가입 핸들러
   * @returns
   */
  const handleClickSignup = async () => {
    if (!validation()) {
      return;
    }

    const res = await mutationPostAuthSignupEmail.mutateAsync({
      data: {
        email: `${id}@dev.com`,
        id,
        password,
      },
      params: {
        p: '',
        w: '',
      },
    });
    if (res) {
      signinCredential(res.credential);

      await mutationUsersMe.mutateAsync({
        data: {
          account: { password: '' },
          info: { birthday: '1990-01-01', email: '' },
        },
      });
      navigate('/auth/signup');
    }
  };

  return {
    id,
    password,
    isSwagger,
    message,
    handleChangeId,
    handleChangePassword,
    handleClickSignup,
    handleClickSignin,
    handleChangeCheckBox,
    handleClickBack,
  };
};

export default useTestSignin;
