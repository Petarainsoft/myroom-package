import CircleButton from '@/components/Buttons/CircleButton';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import styles from './styles.module.scss';
import React from 'react';
import StatusMessage from './StatusMessage';
import useMainMode from './hooks';
import Text from '@/components/Text';
import Skeleton from '@/components/Skeleton';
import { nFormatter } from '@/common/utils/string-format';
import RoomEntryButton from './RoomEntryButton';
import CommentOffCanvas from '@/pages/_shared/offcanvas/CommentOffCanvas';
import useRoom from '@/common/hooks/use-room';

type MainModeProps = {
  profileId: string;
  avatarId: string;
};

const MainMode = ({ profileId, avatarId }: MainModeProps) => {
  const {
    showComment,
    isLiked,
    meProfileId,
    commentCount,
    likeCount,
    messageId,
    nickname,
    targetRoomId,
    isProfileLoading,
    handleToggleLike,
    handleClickCustomMode,
    handleClickStatusMode,
    handleClickOpenComment,
    handleClickCloseComment,
  } = useMainMode({ profileId });
  const {currentRoomInfo} = useRoom();

  return (
    <React.Fragment>
      <StatusMessage avatarId={avatarId} profileId={meProfileId === profileId? 'me' : profileId} />
      <CommentOffCanvas
        isOpen={showComment}
        targetId={messageId}
        targetProfileId={profileId}
        onClose={handleClickCloseComment}
      />
      <div className={styles['wrap']}>
        <div className={styles['social']}>
          <CustomButton className={styles['button']} onClick={handleToggleLike}>
            <Icon
              name={isLiked ? `Heart_S_On` : `Heart_S`}
              className={styles['icon']}
            />{' '}
            <Text text={`${nFormatter(likeCount)}`} />
          </CustomButton>
          <CustomButton
            className={styles['button']}
            onClick={handleClickOpenComment}
          >
            <Icon name={`Comment_S`} className={styles['icon']} />{' '}
            <Text text={`${nFormatter(commentCount)}`} />
          </CustomButton>
        </div>
        {currentRoomInfo?.mine && profileId === meProfileId ? (
          <div className={styles['action']}>
            <CircleButton
              size="xxl"
              shape="circle"
              onClick={handleClickCustomMode}
            >
              <Icon name={`t-shirt`} />
            </CircleButton>
            <CircleButton
              size="xxl"
              shape="circle"
              onClick={handleClickStatusMode}
            >
              <Icon name={`Chat_alt`} />
            </CircleButton>
          </div>
        ) : (
          <RoomEntryButton
            isActive={true}
            roomId={targetRoomId!}
            onClick={() => {}}
          />
        )}
        <div className={styles['nickname-wrap']}>
          <Skeleton isLoading={isProfileLoading} style={{ flex: 1 }}>
            {currentRoomInfo?.ownerId === profileId && <div className={styles['owner']}>👑</div>}
            <div className={styles['nickname']}>
              <Text text={nickname} />
            </div>
          </Skeleton>
        </div>
      </div>
    </React.Fragment>
  );
};

export default MainMode;
