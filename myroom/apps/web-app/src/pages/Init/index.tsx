import useAuth from '@/common/hooks/use-auth';
import Spinner from '@/components/Spinner';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Init = () => {
  const navigate = useNavigate();
  const {isLogined}  = useAuth();

  React.useEffect(() => {
    if(isLogined) {
      navigate('/rooms/me', { replace: true });
    }
    else {
      navigate('/auth/signin', { replace: true });
    }
  }, [isLogined]);

  return (
    <React.Fragment>
      <Spinner />
    </React.Fragment>
  );
};

export default Init;
