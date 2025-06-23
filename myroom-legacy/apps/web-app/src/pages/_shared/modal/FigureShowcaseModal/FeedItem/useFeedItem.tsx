// useFeedItemLogic.tsx
import { useState, useMemo } from 'react';
import useFigureShowcase from '../hooks';
import useProfileAPI from '@/apis/User/Profile';
import { useOffCanvasOpenAndClose } from '@/common/utils/common.hooks';
import {
  useFollowActions,
  useFollowState,
  useNavigationActions,
} from '../item.hook';
import { ISelectButton } from '@/pages/_shared/offcanvas/SelectOffCanvas';
import { figureShowcaseTabAtom } from '../store';
import { useAtom } from 'jotai';
import useMe from '@/common/hooks/use-me';
import useStatusMessage from '@/common/hooks/use-status-message';

export const useFeedItem = (profileId: string) => {
  const [tab] = useAtom(figureShowcaseTabAtom);
  const { handleShowAvatarInfoModal } = useFigureShowcase();
  const { isFollowingState, setIsFollowingState } = useFollowState(profileId);
  const { handleEntryProfile } = useNavigationActions();
  const { handleFollow } = useFollowActions(setIsFollowingState);
  const { fetchProfile } = useProfileAPI();
  const { data: figureData, isLoading: isLoadingFigureData } =
    fetchProfile(profileId);
  const { meProfileId } = useMe();
  const [menuOffCanvas, setMenuOffCanvas] = useState({
    isOpen: false,
    isVisible: false,
  });
  const {
    feedId,
    statusMessage,
    statusImage,
    createTime,
    statusAvatarThumbnail,
    isLoading: isLoadingMessage,
  } = useStatusMessage(profileId);
  const isMineFeed = useMemo(() => {
    return meProfileId === profileId;
  }, [profileId, meProfileId]);

  const { handleOffCanvasOpen, handleOffCanvasClose } =
    useOffCanvasOpenAndClose(setMenuOffCanvas);

  const FeedMenuActions = useMemo(() => {
    const defaultProfileAction: ISelectButton[] = [
      {
        icon: 'Profile_M',
        textId: 'GMY.000038',
        defaultValue: '프로필 보기',
        onClick: () => {
          handleOffCanvasClose();
          handleEntryProfile({ profileId, tab, isMe: isMineFeed });
        },
      },
    ];
    const deleteFollow: ISelectButton[] = [
      {
        icon: 'Myplay_plus_M',
        textId: 'GPF.000013',
        defaultValue: '팔로우 취소',
        onClick: () => {
          handleOffCanvasClose();
          handleFollow({ profileId, isFollow: true });
        },
      },
    ];
    const postFollow: ISelectButton[] = [
      {
        icon: 'Myplay_plus_M',
        textId: 'GMY.000025',
        defaultValue: '팔로우',
        onClick: () => {
          handleOffCanvasClose();
          handleFollow({ profileId, isFollow: false });
        },
      },
    ];

    const FeedMenuActions: ISelectButton[] = [
      ...defaultProfileAction,
      ...(isFollowingState ? deleteFollow : postFollow),
    ];

    return FeedMenuActions;
  }, [
    isFollowingState,
    profileId,
    tab,
    isMineFeed,
    handleOffCanvasClose,
    handleFollow,
    handleEntryProfile,
  ]);

  const backgroundColor = useMemo(() => {
    const color = figureData?.data.option.background_color;
    return color ? { backgroundColor: color } : { backgroundColor: '#F9F9F9' };
  }, [figureData]);

  const backgroundImageStyle = useMemo(() => {
    const imageUrl = figureData?.data?.resource?.avatar_selfie;
    return imageUrl ? { backgroundImage: `url(${statusAvatarThumbnail})` } : {};
  }, [statusAvatarThumbnail]);

  return {
    figureData,
    handleShowAvatarInfoModal,
    isLoadingFigureData,
    menuOffCanvas,
    handleOffCanvasOpen,
    handleOffCanvasClose,
    FeedMenuActions,
    backgroundColor,
    backgroundImageStyle,
    isFollowingState,
    feedId,
    statusMessage,
    statusImage,
    createTime,
    isLoadingMessage,
  };
};
