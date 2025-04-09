import style from './style.module.scss';
import StatusMessageItem from './StatusMessageItem';
import Reaction from './Reaction';
import Text from '@/components/Text';
import { dFormatter } from '@/common/utils/string-format';
import Icon from '@/components/Icon';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import CommentItem from './CommentItem';
import IconButton from '@/components/Buttons/IconButton';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import CustomButton from '@/components/Buttons/CustomButton';

import React from 'react';
import { useCommentActions, useNavigationActions } from '../item.hook';
import { useFeedItem } from './useFeedItem';
import classNames from 'classnames';
import Skeleton from '@/components/Skeleton';
interface IFeedItem extends React.HTMLAttributes<HTMLDivElement> {
  isMe: boolean;
  profileId: string;
}

const FeedItem = React.forwardRef<HTMLDivElement, IFeedItem>((props, ref) => {
  const { isMe, profileId } = props;
  const {
    figureData,
    handleShowAvatarInfoModal,
    menuOffCanvas,
    handleOffCanvasOpen,
    handleOffCanvasClose,
    FeedMenuActions,
    backgroundColor,
    backgroundImageStyle,
    isFollowingState,
    isLoadingFigureData,
    feedId,
    statusMessage,
    statusImage,
    createTime,
    isLoadingMessage,
  } = useFeedItem(profileId);

  const { onClickComment } = useCommentActions(profileId);

  const { handleEntryRoom } = useNavigationActions();

  return (
    <>
      <div
        className={classNames(style.figureShowcaseFeedItemWrapper, {
          [style.displayNone]: isMe && isFollowingState === false,
        })}
        ref={ref}
      >
        <div className={style.FeedItemHeader}>
          <Skeleton
            circle
            isLoading={isLoadingFigureData}
            width={40}
            height={40}
          >
            <Profile
              shape={'circle-br'}
              size="xl"
              src={figureData?.data?.resource?.avatar_selfie}
            />
          </Skeleton>
          <div className={style.flex}>
            <div className={style.feedItemHeaderTop}>
              <div className={style.feedNickname}>
                <Skeleton isLoading={isLoadingFigureData} width={150}>
                  <Text text={`${figureData?.data.option.nick}`} />
                </Skeleton>
              </div>
              <CustomButton
                className={style.menu}
                onClick={() => handleOffCanvasOpen()}
              >
                <Icon name="Menu_User_SS" />
              </CustomButton>
            </div>
            <div className={style.feedItemHeaderBottom}>
              <div className={style.feedUserId}>
                <Skeleton isLoading={isLoadingFigureData} width={150}>
                  <Text text={`@${figureData?.data.user_id}`} />
                </Skeleton>
              </div>
              {createTime && (
                <div className={style.createFeedDate}>
                  <Skeleton isLoading={isLoadingMessage} width={26}>
                    <Text text={dFormatter(createTime)} />
                  </Skeleton>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={style.feedItemContent} style={backgroundColor}>
          <Skeleton isLoading={isLoadingFigureData} height={341}>
            <Skeleton isLoading={isLoadingMessage}>
              <CommentItem feedId={feedId} onClickComment={onClickComment} />
            </Skeleton>
            <div className={style.feedStatusMessageWrapper}>
              <Skeleton isLoading={isLoadingMessage}>
                <StatusMessageItem text={statusMessage} imageId={statusImage} />
              </Skeleton>
            </div>
            <div className={style.feedThumbnailWrapper}>
              <Skeleton isLoading={isLoadingFigureData}>
                <div
                  onClick={() =>
                    handleShowAvatarInfoModal(
                      profileId,
                      figureData?.data.avatar_id,
                    )
                  }
                  className={style.avatarThumbnail}
                  style={backgroundImageStyle}
                />
              </Skeleton>
            </div>
            <CustomButton
              className={style.playButton}
              onClick={() =>
                handleShowAvatarInfoModal(profileId, figureData?.data.avatar_id)
              }
            >
              <Icon name="Hand_Motion_S" className={style.handIcon} />
              <div>
                <Text
                  locale={{ textId: 'GPF.000014' }}
                  defaultValue="탭해서 액션 보기"
                />
              </div>
            </CustomButton>
          </Skeleton>
        </div>
        <div className={style.feedItemAction}>
          <Reaction onClickComment={onClickComment} feedId={feedId} />
          <IconButton
            onClick={() => handleEntryRoom(figureData?.data.myroom_id)}
            iconName="Myroom_S"
          >
            <Text locale={{ textId: 'GCM.000004' }} defaultValue="마이룸" />
          </IconButton>
        </div>
      </div>
      {menuOffCanvas.isVisible && (
        <SelectOffCanvas
          isOpen={menuOffCanvas.isOpen}
          onClose={() => handleOffCanvasClose()}
          buttonList={FeedMenuActions}
          isIconButton={true}
        />
      )}
    </>
  );
});

export default FeedItem;
