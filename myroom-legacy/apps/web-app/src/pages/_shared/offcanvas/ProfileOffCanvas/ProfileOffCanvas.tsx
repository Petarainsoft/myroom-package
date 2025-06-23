import React, { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  uiProfileAtom,
  // uiFollowAtom,
  //  isOwnRoomAtom,
  //currentRoomProfileIdAtom,
  uiSignInSheetAtom,
} from '@/common/stores';
import useAuth from '@/common/hooks/use-auth';
import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import { logger } from '@/common/utils/logger';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import style from './style.module.scss';
import Container from '@/pages/_shared/layouts/Container';
import useRoom from '@/common/hooks/use-room';
import CustomButton from '@/components/Buttons/CustomButton';
import { auth } from '@/common/utils/auth';
import { useNavigate } from 'react-router-dom';
import useMe from '@/common/hooks/use-me';
import ProfileThumnail from '@/pages/_shared/ui/Profiles/Profile';
import usePopup from '@/common/hooks/Popup/usePopup';
import { useOffCanvasOpenAndClose } from '@/common/utils/common.hooks';
import useProfileAPI from '@/apis/User/Profile';

const ProfileOffCanvas = (): React.ReactElement => {
  const navigate = useNavigate();
  const [uiProfile, setUiProfile] = useAtom(uiProfileAtom);
  const { handleOffCanvasClose } = useOffCanvasOpenAndClose(setUiProfile);
  // const [uiFollow] = useAtom(uiFollowAtom);
  const [isFollowing] = React.useState<boolean | null>(null);
  const [, setUISignInSheet] = useAtom(uiSignInSheetAtom);
  //const isOwnRoom = useAtomValue(isOwnRoomAtom); // uri 내 마이룸 아이디/ - myRoom 단건조회를 통해 나온 프로필 아이디
  const { currentRoomInfo } = useRoom();
  const { meRoomId, meThumbnail, meProfileId } = useMe();
  const { showToastPopup } = usePopup();
  // const FigureShowcaseModal = useModal('FigureShowcaseModal');
  const { isLogined, signout } = useAuth();
  const { fetchProfile } = useProfileAPI();

  const { data: profileData } = fetchProfile(currentRoomInfo?.ownerId);

  const handleClose = () => {
    logger.log('handleClose ');
    handleOffCanvasClose();
  };

  const showPreparingToast = () => {
    showToastPopup({ titleText: '준비 중입니다.' });
  };

  const handleMenu = (actionType: string) => () => {
    logger.log('handleClick ', actionType);
    switch (actionType) {
      case 'LINK':
        logger.log('LINK ACTION ', currentRoomInfo?.mine);
        // TODO 본인 프로필 확인

        if (!currentRoomInfo?.mine)
          navigate(`/profiles/${currentRoomInfo?.ownerId}?isMine=N`);
        else navigate(`/profiles/${currentRoomInfo?.ownerId}?isMine=Y`);
        break;
      case 'SHOWCASE_ME':
        handleClose();
        logger.log('SHOWCASE ACTION ');
        // FigureShowcaseModal.createModal({ profileId: 'me', isMe: true });
        navigate(`/figure-showcase/${meProfileId}`);
        break;
      case 'SHOWCASE_NOT_ME':
        handleClose();
        logger.log('SHOWCASE ACTION ');
        // FigureShowcaseModal.createModal({
        //   profileId: roomOwnerProfileId,
        //   isMe: false,
        // });
        navigate(`/figure-showcase/${currentRoomInfo?.ownerId}`);
        break;
      case 'SHARE':
        logger.log('SHARE ACTION ');
        window.navigator.share({
          url: `${location.origin}/rooms/${meRoomId}`,
          text: '',
        });
        break;
      case 'OPTION':
        logger.log('OPTION ACTION ');
        navigate('/profileAccountSetting');
        // showPreparingToast();
        break;
      case 'SAVE':
        logger.log('SAVE ACTION ');
        navigate('/scrapBook');
        break;
      case 'REPORT':
        logger.log('REPORT ACTION ');
        showPreparingToast();
        break;
      case 'BLOCK':
        logger.log('BLOCK ACTION ');
        showPreparingToast();
        break;
      case 'SIGNOUT':
        logger.log('SIGNOUT ACTION ');
        if (isLogined) {
          auth.clearCredential();
          signout();
          location.href = '/';
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    // followingsList?.list.some((item) => item._id === currentRoomInfo?.ownerId)
    //   ? setIsFollowing(true)
    //   : setIsFollowing(false);
  }, []);
  /*
  const handleFollow = async () => {
    logger.log('handleFollow uiFollow? ', uiFollow);
    logger.log('handleFollow currentRoomProfileId? ', currentRoomProfileId);
    logger.log('handleFollow followingsList? ', followingsList);
    showPreparingToast();
    if (!isLogined) {
      logger.log('비로그인 시 팔로우 불가능 ');
      showPreparingToast();
      return;
    }

    // -> 아래 코드 작동 // 프로토에는 팔로우가 없다고함 ( 팔로우 리스트는 강제지정 데이터로 해결 확인필요 )
    // const followRes = await mutationPutFollow.mutateAsync({ profileId: currentRoomProfileId })
    // if (followRes) {
    //   logger.log('handleFollow followRes 성공', followRes)
    //   setUiFollow(!uiFollow);
    // } else {
    //   logger.log('handleFollow followRes 실패', followRes)
    // }
  };
*/
  const handleFollowBtn = useCallback(() => {
    if (isLogined === false) {
      setUISignInSheet(true);
      return;
    }
    if (currentRoomInfo) {
      // handleRequestFollow({
      //   profileId: currentRoomInfo.ownerId!,
      //   isFollow: isFollowing!,
      // });
    }
  }, [isLogined, isFollowing, currentRoomInfo?.ownerId]);

  const handleEdit = () => {
    logger.log('handleEdit ');
    showPreparingToast();
    // if(authStats)
    // 프로필 편집
  };

  const BtnEdit = (): React.ReactElement => {
    return (
      <CustomButton
        onClick={handleEdit}
        className={`${style.profileBtn} ${style.edit}`}
      >
        <div className={`${style.editIcon}`}>
          <Icon name={`Edit_S`} />
        </div>
        <div className={`${style.editText}`}>
          <Text locale={{ textId: 'GCM.000020' }} defaultValue="편집" />
        </div>
      </CustomButton>
    );
  };

  const BtnFollow = (): React.ReactElement => {
    console.log('isFollowing', isFollowing);
    if (isFollowing == null) return <></>;
    return (
      <CustomButton
        onClick={handleFollowBtn}
        className={
          isFollowing
            ? `${style.followBtn} ${style.isFollowing}`
            : `${style.followBtn}`
        }
      >
        <Text
          locale={{ textId: isFollowing ? 'GMY.000024' : 'GMY.000025' }}
          defaultValue="팔로우/팔로잉"
        />
      </CustomButton>
    );
  };

  const ProfileMenuMe = (): React.ReactElement => {
    return (
      <React.Fragment>
        <div onClick={handleMenu('LINK')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Profile_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000020' }}
              defaultValue="내 프로필 바로가기"
            />
          </div>
        </div>
        <div onClick={handleMenu('SHOWCASE_ME')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Showcase_Figure_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000142' }}
              defaultValue="내 피규어 진열장 바로가기"
            />
          </div>
        </div>
        <div onClick={handleMenu('SHARE')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Myroom_Share_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000021' }}
              defaultValue="내 마이룸 공유하기"
            />
          </div>
        </div>
        <div onClick={handleMenu('OPTION')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Setting_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000022' }}
              defaultValue="설정 및 계정"
            />
          </div>
        </div>
        <div onClick={handleMenu('SAVE')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Save_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text locale={{ textId: 'GMY.000023' }} defaultValue="저장됨" />
          </div>
        </div>
        {isLogined && (
          <div onClick={handleMenu('SIGNOUT')} className={style.profileMenu}>
            <div className={style.dimension}>
              <Icon name={`Save_M`} />
            </div>
            <div className={style.profileMenuText}>
              <Text locale={{ textId: '#로그아웃' }} />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  };

  const ProfileMenuUser = (): React.ReactElement => {
    return (
      <React.Fragment>
        <div onClick={handleMenu('LINK')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Profile_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000026' }}
              defaultValue="프로필 바로가기"
            />
          </div>
        </div>
        <div
          onClick={handleMenu('SHOWCASE_NOT_ME')}
          className={style.profileMenu}
        >
          <div className={style.dimension}>
            <Icon name={`Showcase_Figure_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000143' }}
              defaultValue="피규어 진열장 바로가기"
            />
          </div>
        </div>
        <div onClick={handleMenu('SHARE')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Myroom_Share_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text
              locale={{ textId: 'GMY.000027' }}
              defaultValue="마이룸 공유하기"
            />
          </div>
        </div>
        <div onClick={handleMenu('REPORT')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Notify_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text locale={{ textId: 'GCM.000021' }} defaultValue="신고" />
          </div>
        </div>
        <div onClick={handleMenu('BLOCK')} className={style.profileMenu}>
          <div className={style.dimension}>
            <Icon name={`Block_M`} />
          </div>
          <div className={style.profileMenuText}>
            <Text locale={{ textId: 'GCM.000022' }} defaultValue="차단" />
          </div>
        </div>
      </React.Fragment>
    );
  };

  React.useEffect(() => {}, []);

  return (
    <>
      <OffCanvas
        isOpen={uiProfile.isOpen}
        onClose={handleClose}
        snapPoints={[1, 96]}
        initialSnap={0}
        variant={'primary'}
        headerOptions={{
          customElement: (
            <Container className={style.profileHeader}>
              <div className={style.profileUserInfo}>
                <ProfileThumnail
                  className={style.profileImage}
                  shape={'circle'}
                  size="xxl"
                  src={meThumbnail}
                />
                <div className={style.profileName}>
                  <div className={style.userNickname}>
                    <p>
                      <Text text={profileData?.data?.name} />
                    </p>
                  </div>
                  <div className={style.userId}>
                    <Text text={`@${currentRoomInfo?.ownerId}`} />
                  </div>
                </div>
              </div>
              {currentRoomInfo?.mine ? <BtnEdit /> : <BtnFollow />}
            </Container>
          ),
        }}
      >
        <div className={style.profileContainer}>
          <div className={style.profileMenuContainer}>
            {currentRoomInfo?.mine ? <ProfileMenuMe /> : <ProfileMenuUser />}
          </div>
        </div>
      </OffCanvas>
    </>
  );
};

export default ProfileOffCanvas;
