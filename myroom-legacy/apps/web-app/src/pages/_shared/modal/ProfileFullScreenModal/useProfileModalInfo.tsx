import useMe from '@/common/hooks/use-me';
import React from 'react';
import { logger } from '@/common/utils/logger';

const useProfileModalInfo = () => {
  const [isMineInPage, setIsMineInPage] = React.useState(false);
  const [profileIdInPage, setProfileIdInPage] = React.useState<any>('');
  const { meProfileId } = useMe();

  React.useEffect(() => {
    logger.log(' useProfile ', meProfileId);
    const uriArr = location.pathname.split('/');
    const uriLength = uriArr.length < 3;
    const profileCheck = location.search.split('=')[1];

    if (uriLength || profileCheck === 'Y') {
      setIsMineInPage(true);
      setProfileIdInPage(meProfileId);
    } else {
      setIsMineInPage(false);
      setProfileIdInPage(uriArr[uriArr.length - 1]);
    }
  }, [meProfileId]);

  return { profileIdInPage, isMineInPage };
};

export default useProfileModalInfo;
