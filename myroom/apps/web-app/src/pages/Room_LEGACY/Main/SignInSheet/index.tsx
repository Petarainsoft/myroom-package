import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { uiSignInSheetAtom, uiSignInSheetDimmedAtom } from '@/common/stores';
import { logger } from '@/common/utils/logger';
import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import style from './style.module.scss';
import useAuth from '@/common/hooks/use-auth';
import { auth } from '@/common/utils/auth';

const SignInSheet = (): React.ReactElement => {
  const [uiSignInSheet, setUISignInSheet] = useAtom(uiSignInSheetAtom);
  const [uiSignInSheetDimmed] = useAtom(uiSignInSheetDimmedAtom);
  const { isLogined } = useAuth();
  const navigate = useNavigate();

  const handleClose = () => {
    logger.log('handleClose ');
    setUISignInSheet(false);
  };

  const handleSignIn = () => {
    logger.log('handleSignIn ');
    navigate('/auth/signIn');
    // if(authStats)
    // 프로필 편집
  };

  const BtnSignIn = (): React.ReactElement => {
    return (
      <Button
        onClick={handleSignIn}
        className={style.signInBtn}
        size="s"
        variant="tertiary"
      >
        <Text text="로그인" />
      </Button>
    );
  };

  useEffect(() => {
    console.log(
      'testlog',
      'isLogined: ',
      isLogined,
      'authRefreshToken: ',
      auth.getRefreshToken(),
    );
    if (isLogined === false && !auth.getRefreshToken()) {
      setUISignInSheet(true);
      return;
    }
    if (uiSignInSheet) {
      setUISignInSheet(false);
      return;
    }
  }, [isLogined]);

  return (
    <OffCanvas
      isOpen={uiSignInSheet}
      onClose={handleClose}
      isDimmed={uiSignInSheetDimmed}
      snapPoints={[95]}
      initialSnap={0}
      disableDrag={true}
      variant={'primary'}
      offCanvasClassName={'signInSheet'}
      headerOptions={{
        customElement: (
          <div className={style.signInSheetWrapper}>
            <div className={style.signInSheetHeader}>
              <div className={style.signInSheetText}>
                <Text
                  locale={{
                    textId: 'GMY.000138',
                  }}
                  hasTag={true}
                />
              </div>
              <BtnSignIn />
            </div>
          </div>
        ),
      }}
    >
      {/* <div>content</div> */}
    </OffCanvas>
  );
};

export default SignInSheet;
