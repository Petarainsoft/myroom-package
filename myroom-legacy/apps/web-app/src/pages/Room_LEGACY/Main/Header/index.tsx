import React, { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { uiProfileAtom } from '@/common/stores';
import { logger } from '@/common/utils/logger';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import style from './style.module.scss';
import useRoomInfo from '../../useRoomInfo';
import RoomProfile from '@/pages/_shared/ui/Profiles/RoomProfile';
import { useOffCanvasOpenAndClose } from '@/common/utils/common.hooks';

const Header = (): React.ReactElement => {
  const navigate = useNavigate();
  //const { isLogined } = useAuth();
  const { isMyroom, roomOwnerNickName, roomOwnerThumnail } = useRoomInfo();
  const setUiProfile = useSetAtom(uiProfileAtom);
  const { handleOffCanvasOpen } = useOffCanvasOpenAndClose(setUiProfile);
  //const isOwnRoom = useAtomValue(isOwnRoomAtom);

  const handleProfile = () => {
    logger.log('handleProfile ');
    handleOffCanvasOpen();
  };

  const handleGoBack = (e: MouseEvent<HTMLButtonElement>) => {
    logger.log('handleGoBack document.referrer ', e);
    logger.log('handleGoBack document.referrer ', document.referrer);
    logger.log('window.location.origin ', window.location.origin);
    logger.log(
      'handleGoBack document.referrer ',
      document.referrer.includes(window.location.origin),
    );

    /** document.referrer 통해 이전이 우리 도메인이 아니면 핑스로 연결, 우리도메인인 경우 -1 */
    const origin = window.location.origin;
    const referrer = document.referrer;
    const redirectBack = origin.includes(referrer);
    if (redirectBack) navigate(-1);
    else navigate('/home');
    location.reload();
    // location.reload는 임시 로직
    // FIXME: reoload 삭제 후 useRoom에서 location path에 따라 scene을 새로 그리도록 로직 수정
    //현재 로직으로는 피규어 클릭모드에서 마이룸 이동을 2번 이상 반복하고 뒤로가기 버튼을 클릭했을 때 /home으로 이동함
  };

  /** Todo : 프로필 모드 진입 시 UI 변경 */
  //TODO: 추후 HeaderLeft 컴포넌트 사용
  const MemberHeader = (): React.ReactElement => {
    return (
      <div className={style.header}>
        <div className={style.nameContainer}>
          <RoomProfile />
        </div>
        <CustomButton onClick={handleProfile} className={style.dimension}>
          <Icon name={`Top_Menu`} />
        </CustomButton>
      </div>
    );
  };

  //비로그인 || 남의름
  const NoneMemberHeader = (): React.ReactElement => {
    return (
      <div className={style.header}>
        <div className={style.nameContainer}>
          <CustomButton
            onClick={handleGoBack}
            className={`${style.dimension} ${style.rightMargin}`}
          >
            <Icon name={`Top_Arrow_left_M`} />
          </CustomButton>
          <RoomProfile />
        </div>
        <CustomButton onClick={handleProfile} className={style.dimension}>
          <Icon name={`Top_Menu_User`} />
        </CustomButton>
      </div>
    );
  };
  return (
    <React.Fragment>
      {isMyroom ? <MemberHeader /> : <NoneMemberHeader />}
      {/* <MemberHeader /> */}
      {/* <NoneMemberHeader /> */}
    </React.Fragment>
  );
};

export default Header;
