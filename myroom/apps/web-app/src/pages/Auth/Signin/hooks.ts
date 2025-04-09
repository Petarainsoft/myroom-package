import useAuth from '@/common/hooks/use-auth';
import useMe from "@/common/hooks/use-me";
import { auth } from '@/common/utils/auth';
import {AuthProvider,authorizesWithRedirect } from '@colorverse/auth';
import React, { useCallback } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useSignin = () => {
    const [isSignin, setIsSignin] = useState(true);

    const navigate = useNavigate();
    const { isLogined } = useAuth();
    const { checkSignup } = useMe();

    const handleClickToggleSign = () => {
        setIsSignin(prev => !prev);
    }

    const handleClickSignin = async (provider:AuthProvider) => {
        authorizesWithRedirect(auth, {provider, worldId:""});
    }

    const handleClickTestSignin = async () => {
        navigate('/auth/test-signin');
    }


    const checkWithRedirect = async () => {
        const status = await checkSignup();
        if (status === 'USER') {
          navigate('/rooms/me');
        }
        else if(status === 'UNSIGNUP') {
          navigate('/auth/signup');
        }
        else {
          return;
        }
    }
  
    const handleClickBack = useCallback(() => { 
      navigate(-1);
    }, []);

    React.useEffect(() => { 
        checkWithRedirect();
    }, [isLogined]);
    
    return {isSignin, handleClickSignin, handleClickTestSignin, handleClickToggleSign, handleClickBack}
}

export default useSignin;