import { useMemo } from 'react';
import { useFollowActions, useFollowState } from '../item.hook';
import useProfileAPI from '@/apis/User/Profile';
import useStatusMessage from '@/common/hooks/use-status-message';
import style from './style.module.scss';
import Icon from '@/components/Icon';

export const useCardItem = (profileId: string) => {
  const { isFollowingState, setIsFollowingState } = useFollowState(profileId);
  const { handleFollow } = useFollowActions(setIsFollowingState);
  const { statusMessage, statusImage, statusAvatarThumbnail } = useStatusMessage(profileId);
  const { fetchProfile } = useProfileAPI();
  const { data: figureData, isLoading: isLoadingFigureData } =
    fetchProfile(profileId);

  const backgroundColor = useMemo(() => {
    const color = figureData?.data.option.background_color;
    return color ? { backgroundColor: color } : { backgroundColor: '#F9F9F9' };
  }, [figureData]);

  const backgroundImageStyle = useMemo(() => {
    return statusAvatarThumbnail
      ? { backgroundImage: `url(${statusAvatarThumbnail})` }
      : {};
  }, [statusAvatarThumbnail]);

  const BalloonIcon = () => {
    if (statusMessage || statusImage)
      return (
        <div className={style.messageIconWrapper}>
          <Icon name="Action_Message_Balloon_M" />
        </div>
      );
  };

  return {
    isFollowingState,
    handleFollow,
    figureData,
    isLoadingFigureData,
    backgroundColor,
    backgroundImageStyle,
    BalloonIcon,
  };
};
