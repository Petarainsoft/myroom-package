// item.hooks.tsx

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFollowAPI from '@/apis/User/Follow';
import useFollow from '@/apis/User/Follow/hooks';
import { useAtom } from 'jotai';
import {
  showCaseIsCommentOpenAtom,
  showcaseStatusMessageCommentAtom,
} from '@/common/stores';
import useMe from '@/common/hooks/use-me';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import { placedFigureProfileIdsAtom } from './store';
import useAvatarAPI from '@/apis/Space/Avatar';

export const useFollowState = (profileId: string) => {
  const { fetchMeFollowings } = useFollowAPI();
  const [isFollowingState, setIsFollowingState] = useState<boolean | null>(
    null,
  );
  const [flag, setFlag] = useState(true);
  const { data: followMeData, isLoading: isLoadingFollowMeData } =
    fetchMeFollowings();

  const getIsFollowing = useCallback(
    (itemId: string) => {
      if (isLoadingFollowMeData) return null;
      const myFollowList = followMeData?.list;
      if (myFollowList) return myFollowList.some((item) => item._id === itemId);
      return true;
    },
    [isLoadingFollowMeData, followMeData],
  );

  useEffect(() => {
    if (!followMeData) return;
    if (isLoadingFollowMeData) return;
    if (!flag) return;
    const isFollowing = getIsFollowing(profileId);
    setIsFollowingState(isFollowing);
    setFlag(false);
  }, [isLoadingFollowMeData, followMeData, profileId, getIsFollowing]);

  return { isFollowingState, setIsFollowingState };
};

export const useCommentActions = (profileId: string) => {
  const [, setShowcaseStatusMessageComment] = useAtom(
    showcaseStatusMessageCommentAtom,
  );
  const [, setShowCaseIsCommentOpen] = useAtom(showCaseIsCommentOpenAtom);

  const onClickComment = useCallback(
    (id: string) => {
      setShowcaseStatusMessageComment({
        targetId: id,
        targetProfileId: profileId,
      });
      setShowCaseIsCommentOpen(true);
    },
    [profileId, setShowCaseIsCommentOpen, setShowcaseStatusMessageComment],
  );

  return { onClickComment };
};

export const useFollowActions = (
  setIsFollowingState: React.Dispatch<React.SetStateAction<boolean | null>>,
) => {
  const { handleRequestFollow } = useFollow();

  const handleFollow = async ({
    profileId,
    isFollow,
  }: {
    profileId: string;
    isFollow: boolean;
  }): Promise<void> => {
    const followState: boolean = await handleRequestFollow({
      profileId,
      isFollow,
    });
    setIsFollowingState(followState);
  };

  return { handleFollow };
};

export const useNavigationActions = () => {
  const navigate = useNavigate();

  const handleEntryRoom = useCallback(
    (roomId?: string) => {
      navigate(`/rooms/${roomId}`);
      location.reload();
    },
    [navigate],
  );

  const handleTab = useCallback(
    (tab: number) => {
      navigate(`?tab=${tab}`, {
        replace: true,
        state: { tab, profileId: null },
      });
    },
    [navigate],
  );

  const handleInitializeLocation = useCallback(
    (tab: number) => {
      navigate(`?tab=${tab}`, {
        replace: true,
        state: { tab, profileId: null },
      });
    },
    [navigate],
  );

  const handleEntryProfile = useCallback(
    ({
      profileId,
      isMe,
      tab,
    }: {
      profileId: string;
      isMe: boolean;
      tab: number;
    }) => {
      navigate(`?tab=${tab}`, {
        replace: true,
        state: { tab, profileId },
      });
      navigate(`/profiles/${profileId}?isMine=${isMe ? 'Y' : 'N'}`);
    },
    [navigate],
  );

  return {
    handleEntryRoom,
    handleEntryProfile,
    handleTab,
    handleInitializeLocation,
  };
};

export const usePlacedFigures = (isMe: boolean) => {
  const { meRoomId } = useMe();
  const { fetchMyroom } = useMyRoomAPI();
  const { fetchAvatars } = useAvatarAPI();
  const [queryResolveFigure, setQueryResolveFigure] = useState(false);
  const [placeFigureIds, setPlaceFigureIds] = useState<string[] | null>(null);
  const [, setPlacedFigureProfileIds] = useAtom(placedFigureProfileIdsAtom);
  const roomIdToFetch = isMe ? meRoomId! : '';
  const { data: myroomData, isLoading: isLoadingMyroom } =
    fetchMyroom(roomIdToFetch);

  const figureListResult = fetchAvatars(isMe ? placeFigureIds ?? [] : []);

  //내 마이룸 진열장이 아닌 경우 로직 종료
  //현재 내 마이룸에 배치된 아바타 아이템 profileId리스트 placedFigureProfileIds에 저장
  useEffect(() => {
    if (!placeFigureIds || !isMe) return;
    if (queryResolveFigure) return;
    if (placeFigureIds.length === 0) {
      setPlacedFigureProfileIds([]);
      setQueryResolveFigure(true);
    }
    const successCheck = figureListResult.every(
      (result) => result.status === 'success',
    );

    if (successCheck && figureListResult.length > 0) {
      const combinedData = figureListResult.map((result) => result.data);
      setPlacedFigureProfileIds(
        combinedData.map((item) => item?.data.profile_id as string),
      );
      setQueryResolveFigure(true);
    }
  }, [figureListResult, isMe]);

  //현재 내 마이룸에 배치된 아바타 아이템 id리스트
  useEffect(() => {
    if (isLoadingMyroom || !isMe) return;
    if (!myroomData) return;
    setPlaceFigureIds(myroomData?.data.option.avatar);
  }, [isLoadingMyroom, isMe]);
};
