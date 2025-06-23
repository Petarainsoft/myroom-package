import { useEffect, useState } from 'react';
import style from './style.module.scss';
import useFigureShowcase from '../hooks';
import { useAtom } from 'jotai';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import { useCardItem } from './useCardItem';
import Skeleton from '@/components/Skeleton';

import { placedFigureProfileIdsAtom } from '../store';

interface ICardItem {
  isMe: boolean;
  profileId: string;
}
const CardItem = ({ isMe, profileId }: ICardItem) => {
  const {
    getIsFigureInRoom,
    handlePlaceFigureItem,
    handleShowAvatarInfoModal,
  } = useFigureShowcase();
  const {
    isFollowingState,
    handleFollow,
    figureData,
    isLoadingFigureData,
    backgroundColor,
    backgroundImageStyle,
    BalloonIcon,
  } = useCardItem(profileId);

  //피규어 배치되어있는지 확인
  const [isFigureInRoom, setIsFigureInRoom] = useState<boolean | null>(null);
  const [placedFigureProfileIds] = useAtom(placedFigureProfileIdsAtom);

  useEffect(() => {
    setIsFigureInRoom(getIsFigureInRoom(profileId));
  }, [placedFigureProfileIds]);

  if (isMe && !isFollowingState) return <></>;

  return (
    <div className={style.figureShowcaseCardItemWrapper}>
      <Skeleton isLoading={isLoadingFigureData} height={188}>
        <div
          onClick={() =>
            handleShowAvatarInfoModal(profileId, figureData?.data.avatar_id)
          }
          className={style.figureShowcaseCard}
          style={backgroundColor}
        >
          <BalloonIcon />
          <div className={style.avatarThumbnail} style={backgroundImageStyle} />
          <div
            className={style.figureUserId}
          >{`@${figureData?.data.user_id}`}</div>
          {/* <div className={style.figureUserId}>@1233030020203020</div> */}

          {isMe && isFigureInRoom != null && (
            <Button
              className={style.figureBottomButton}
              size="s"
              variant={isFigureInRoom ? 'default' : 'tertiary'}
              onClick={(event) => {
                event.stopPropagation();
                if (!isFigureInRoom) handlePlaceFigureItem(figureData?.data);
              }}
            >
              {isFigureInRoom ? (
                <div className={style.checkedIcon}>
                  <Icon name="Deploy_On" />
                </div>
              ) : (
                <Text
                  locale={{ textId: 'GPF.000011' }}
                  defaultValue="배치하기"
                />
              )}
            </Button>
          )}
          {!isMe && isFollowingState != null && (
            <Button
              onClick={(event) => {
                event.stopPropagation();
                handleFollow({ profileId, isFollow: isFollowingState });
              }}
              className={style.figureBottomButton}
              size="s"
              variant={isFollowingState ? 'default' : 'tertiary'}
            >
              {
                <Text
                  locale={{
                    textId: isFollowingState ? 'GMY.000024' : 'GMY.000025',
                  }}
                  defaultValue="팔로잉/팔로우"
                />
              }
            </Button>
          )}
        </div>
      </Skeleton>

      <div className={style.figureNickname}>
        <Skeleton isLoading={isLoadingFigureData}>
          {figureData?.data.option.nick}
        </Skeleton>
      </div>
    </div>
  );
};

export default CardItem;
