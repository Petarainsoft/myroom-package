import React from 'react';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import usePopup from '@/common/hooks/Popup/usePopup';
import useStatusMessageSocial from '../../../AvatarInfoFullScreenModal/StatusMessageMode/useStatusMessageSocial';
import Skeleton from '@/components/Skeleton';

interface IReaction {
  onClickComment: (id: string) => void;
  feedId: string;
  isInactive?: boolean;
}
const Reaction = ({ onClickComment, feedId }: IReaction) => {
  const {
    handlePostLikeStatusMessage,
    statusMessageLikeNum,
    isStatusMessageLiked,
    statusMessageCommentNum,
    isLoadingStatusMessageMyReaction,
  } = useStatusMessageSocial(feedId);
  const { showToastPopup } = usePopup();

  const showToastPopupLikeNotPossible = () => {
    showToastPopup({
      titleText:
        '사용자가 상태 업데이트를 한 번도 하지 않아 ‘좋아요’와 ‘댓글’을 남길 수 없습니다.',
    });
  };
  const handleLikeButton = () => {
    if (!feedId) {
      showToastPopupLikeNotPossible();
      return;
    }
    handlePostLikeStatusMessage();
  };

  const handleClickComment = () => {
    if (!feedId) {
      showToastPopupLikeNotPossible();
      return;
    }
    onClickComment(feedId);
  };
  return (
    <div
      className={`${style.favNcommentInFeed} ${!feedId ? style.inactive : ''}`}
    >
      <div className={style.favorite}>
        <Skeleton
          isLoading={isLoadingStatusMessageMyReaction && !!feedId}
          width={30}
        >
          <div className={style.icon} onClick={handleLikeButton}>
            {isStatusMessageLiked ? (
              <Icon name={`Heart_S_On`} />
            ) : (
              <Icon name={`Heart_S`} />
            )}
          </div>
          <div className={style.num}>
            {/* <Text text={`${nFormatter(statusMessageLikeNum)}`} /> */}
            {statusMessageLikeNum || (
              <Text locale={{ textId: 'GCM.000046' }} defaultValue="좋아요" />
            )}
          </div>
        </Skeleton>
      </div>
      <div className={style.comment}>
        <Skeleton
          isLoading={isLoadingStatusMessageMyReaction && !!feedId}
          width={40}
        >
          <div className={style.icon} onClick={handleClickComment}>
            <Icon name={`Comment_S`} />
          </div>
          <div className={style.num}>
            {statusMessageCommentNum || (
              <Text locale={{ textId: 'GCM.000023' }} defaultValue="댓글" />
            )}
          </div>
        </Skeleton>
      </div>
    </div>
  );
};

export default Reaction;
