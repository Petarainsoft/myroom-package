import React from 'react';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import Profile from '@/pages/Profile';
import { uiAppBarAtom } from '@/common/stores';
import { useAtomValue } from 'jotai';
import { logger } from '@/common/utils/logger';
import { useNavigate } from 'react-router-dom';
import useProfileModalInfo from './useProfileModalInfo';
import View from '../../layouts/View';

type BaseModalProps = Omit<ModalProps, 'onRequestClose'>;
interface IProfilePageModal extends BaseModalProps {
  isPage: true;
}
interface IProfileFullScreenModal extends BaseModalProps {
  isPage: false;
  profileId: string;
  isMine: boolean;
}
type ProfileModalProps = IProfilePageModal | IProfileFullScreenModal;

const ProfileFullScreenModal = ({
  isPage,
  profileId,
  isMine,
  onRequestClose,
}: ProfileModalProps) => {
  const navigate = useNavigate();
  const { profileIdInPage, isMineInPage } = useProfileModalInfo();
  const uiAppBar = useAtomValue(uiAppBarAtom);

  const handleGoBack = () => {
    logger.log('goBack profile');
    if (!isPage) {
      onRequestClose();
      return;
    }
    logger.log('TEST ', window.location)
    const path = window.location.pathname;
    if(path === '/profile') {
      onRequestClose();
      navigate('/rooms/me');
    } else {
      onRequestClose();
      navigate(-1);
    }
    // const redirectBack = undefined;
    // if (redirectBack) navigate(-1);
    // else navigate('/home');
    // onRequestClose();

    /** document.referrer 통해 이전이 우리 도메인이 아니면 핑스로 연결, 우리도메인인 경우 -1 
    const origin = window.location.origin;
    const referrer = document.referrer;
    console.log('REFER TEST ', origin, referrer)
    const redirectBack = origin.includes(referrer);
    if (redirectBack) navigate(-1);
    else navigate('/home');
    onRequestClose();
    location.reload();
    */

    // location.reload는 임시 로직
    // FIXME: reload 삭제 후 useRoom에서 location path에 따라 scene을 새로 그리도록 로직 수정
    //현재 로직으로는 피규어 클릭모드에서 마이룸 이동을 2번 이상 반복하고 뒤로가기 버튼을 클릭했을 때 /home으로 이동함
    /** document.referrer 통해 이전이 우리 도메인이 아니면 핑스로 연결, 우리도메인인 경우 -1 */
  };

  return (
    //TODO: page일때랑 모달일때 디자인 차이 있는지 확인 필요
    <>
      {isPage ? (
        <Modal isOpen={true} className={style.wrap}>
          <View 
            fixed className={style['wrap']}
            headerOptions={{
              closeOptions: { icon: "arrow", onClick: handleGoBack, }
            }
          }>
            <Profile isPage={isPage} profileId={profileIdInPage} isMine={isMineInPage} />
          </View>
        </Modal>
      ) : (
        <Modal isOpen={true} className={style.wrap}>
          <View 
            fixed className={style['wrap']}
            headerOptions={{
              closeOptions: { icon: "arrow", onClick: handleGoBack, }
            }
          }>
            <Profile isPage={isPage} profileId={profileId!} isMine={isMine!} />
          </View>
        </Modal>
      )}
    </>
  );
};

export default ProfileFullScreenModal;
