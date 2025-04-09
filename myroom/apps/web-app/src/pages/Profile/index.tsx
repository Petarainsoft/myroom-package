import React from 'react';
import { useSetAtom } from 'jotai';
import { currentMyRoomIdAtom } from '@/common/stores';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/common/utils/logger';
import useModal from '@/common/hooks/Modal/useModal';
import Button from '@/components/Buttons/Button';
import CircleButton from '@/components/Buttons/CircleButton';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import useProfile from './useProfile';
import ProfileThumnail from '@/pages/_shared/ui/Profiles/Profile';
import { nFormatter } from '@/common/utils/string-format';
import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Image from '@/components/Image';
import Tabs from '../_shared/layouts/Tabs';
import FeedList from './FeedList';
import PingsList from './PingsList';

interface IProfileProps {
  isPage: boolean;
  profileId: string;
  isMine: boolean;
}
const Profile = ({ isPage, profileId, isMine }: IProfileProps) => {
  console.log('for eslint error fix. ', isPage);
  const navigate = useNavigate();
  const {
    myRoomId,
    thumbnailPath,
    avatarSelfie,
    nickName,
    userName,
    userDesc,
    followingCount,
    followerCount,
    roomThumbnail,
    roomColor,
  } = useProfile({ profileId, isMine });
  const setCurrentRoom = useSetAtom(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
  // const {  roomColor } = useRoom();

  // const FigureShowcaseModal = useModal('FigureShowcaseModal');
  const FollowFullScreenModal = useModal('FollowFullScreenModal');
  const [expandDesc, setExpandDesc] = React.useState(false);
  const [listType, setListType] = React.useState<'feed' | 'pings'>('feed');
  // const { showToastPopup } = usePopup();

  // const handleClick = () => {
  //   showToastPopup({ titleText: '준비 중입니다.' });
  // };

  const handleFigureDisplay = () => {
    logger.log('handleFigureDisplay');
    // FigureShowcaseModal.createModal({
    //   profileId: roomOwnerProfileId,
    //   isMe: isMine,
    // });
    navigate(`/figure-showcase/${profileId}`);

    // 피규어 진열장으로 이동
  };

  const handleProfileClick = () => {
    logger.log('handleProfileClick ', isMine);
    if (isMine) {
      FollowFullScreenModal.clearModal();
      setCurrentRoom(myRoomId ? myRoomId : '');
      navigate('/rooms/me');
    } else {
      FollowFullScreenModal.clearModal();
      setCurrentRoom(myRoomId ? myRoomId : '');
      navigate(`/rooms/${myRoomId}`);
    }
  };

  const handleFollow = (type: string) => () => {
    logger.log('handleFollow ', type);
    logger.log('handleFollow ', profileId);
    logger.log('handleFollow ', isMine);
    FollowFullScreenModal.createModal({
      isMine,
      profileId,
      selectedMenu: type,
    });
  };

  const handleDesc = () => {
    logger.log('handleDesc ');
    setExpandDesc(true);
  };
  const ProfileModifyFullScreenModal = useModal('ProfileModifyFullScreenModal');

  const ProfileCardFullScreenModal = useModal('ProfileCardFullScreenModal');
  const handleProfileSetting = () => {
    ProfileModifyFullScreenModal.createModal({ profileId: profileId });
  };

  const handleProfileCardShare = () => {
    ProfileCardFullScreenModal.createModal({ profileId: profileId });
  };

  const showDesc = (desc: string | undefined): React.ReactElement => {
    if (expandDesc) {
      return (
        <div className={style.userDescWrap}>
          <div className={style.userDescLine4}>
            <Text text={desc} />
          </div>
        </div>
      );
    } else {
      return (
        <div className={style.userDescWrap}>
          <div className={style.userDescLine2}>
            <Text text={desc} />
          </div>
          <div onClick={handleDesc} className={style.userDescExpand}>
            <Text text={'더보기'} />
          </div>
        </div>
      );
    }
  };

  const Overlay = (): React.ReactElement => (
    <div className={style.overlay}>
      <div className={style.roomThumbnail}>
        <Image src={roomThumbnail} />
      </div>
      <div className={style.todayWrapper}>
        <Icon name="Visit_Today_S" />
        <span className={style.todayTitle}>Today</span>
        <span className={style.todayNum}>9,999</span>
      </div>
      <div className={style.avatarWrapper}>
        <div className={style.avatarBg} style={{ color: roomColor }}>
          <Icon name={'/images/Profile_Avatar_BG'} />
        </div>
        <div className={style.avatarThumbnail}>
          <Image src={avatarSelfie} />
        </div>
      </div>
      <CustomButton className={style.btnMyRoom}>
        <Icon name="Myroom_S" />
        <span>마이룸</span>
      </CustomButton>
    </div>
  );

  const UserInfo = (): React.ReactElement => (
    <div className={style.userInfo}>
      <div className={style.upper}>
        <div className={style.userIdentity}>
          <div onClick={handleProfileClick} className={style.profileImg}>
            <ProfileThumnail
              className={style.profileImage}
              shape={'circle-br'}
              size="xxxl"
              src={thumbnailPath}
            />
          </div>
          <div className={style.nameContainer}>
            <div className={style.nickName}>
              <div>
                <Text text={nickName} />
              </div>
              <Icon name={`Certified_Check_S`} />
            </div>
            <div className={style.accName}>
              <Text text={`@${userName}`} />
            </div>
          </div>
        </div>

        <div className={style.followInfo}>
          <div className={style.gap}></div>
          <div onClick={handleFollow('follower')} className={style.followTexts}>
            <div className={style.followText}>
              <Text locale={{ textId: 'GMY.000028' }} />
            </div>
            <div className={style.followCnt}>
              {nFormatter(!followerCount ? 0 : followerCount)}
            </div>
          </div>
          <div className={style.divide} />
          <div
            onClick={handleFollow('following')}
            className={style.followTexts}
          >
            <div className={style.followText}>
              <Text locale={{ textId: 'GMY.000024' }} />
            </div>
            <div className={style.followCnt}>
              {nFormatter(!followingCount ? 0 : followingCount)}
            </div>
          </div>
        </div>
      </div>
      <div className={style.userDescContainer} onClick={handleDesc}>
        {showDesc(userDesc)}
      </div>
      <div className={style.profileAction}>
        {isMine ? (
          <Button
            onClick={handleProfileSetting}
            className={style['profileBtn']}
            size="l"
            variant="none"
          >
            <Text locale={{ textId: 'GPF.000001' }} />
          </Button>
        ) : (
          <Button size="l">
            <Text locale={{ textId: 'GPF.000002' }} />
          </Button>
        )}
        <Button
          onClick={handleProfileCardShare}
          className={style['profileBtn']}
          size="l"
          variant="none"
        >
          <Text text="프로필 공유" />
        </Button>
        <CircleButton size="l" onClick={handleFigureDisplay} variant="tertiary">
          <Icon name={`Deco_Figure_M`} />
        </CircleButton>
      </div>
    </div>
  );

  const Social = (): React.ReactElement => (
    <div className={style.social}>
      <Tabs
        elements={[
          {
            textId: '다이어리',
            icon: 'Diary_S',
            selected: listType === 'feed',
            onClick: () => {
              setListType('feed');
            },
          },
          {
            textId: '핑스',
            icon: 'Pings_S',
            selected: listType === 'pings',
            onClick: () => {
              setListType('pings');
            },
          },
        ]}
      ></Tabs>
      {listType === 'feed' ? <FeedList profileId={profileId} /> : <PingsList />}
    </div>
  );

  // React.useEffect(() => {
  //   logger.log('Profile/page', roomOwnerProfileId);
  // }, []);

  return (
    <div className={style.profileWrapper}>
      <div className={style.canvasArea}>
        <Overlay />
        {/* <RoomScene /> */}
      </div>
      <UserInfo />
      <Social />
    </div>
  );
};

export default Profile;
