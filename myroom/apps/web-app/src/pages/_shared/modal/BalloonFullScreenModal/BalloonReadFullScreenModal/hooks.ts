import { BalloonData } from '@/apis/Social/Balloons/type';
import React, { useCallback, useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  meProfileIdAtom,
  notReadBalloonIdsAtom,
} from '@/common/stores';
import { ISelectButton } from '@/pages/_shared/offcanvas/SelectOffCanvas';
import useModal from '@/common/hooks/Modal/useModal';
import useBalloonsAPI from '@/apis/Social/Balloons';
import useBalloonsPatch from '../Hooks/useBalloonsPatch';
import usePopup from '@/common/hooks/Popup/usePopup';
import useRoom from '@/common/hooks/use-room';

const useBalloonReadFullScreenModal = (
  targetRoomProfileId: string,
  targetRoomId: string,
  initBalloonShortData: BalloonData,
  onRequestClose: any,
) => {
  const { currentRoomInfo } = useRoom();
  const { fetchBalloons, fetchBalloonDataById } = useBalloonsAPI();
  const { patchBalloonsState } = useBalloonsPatch();
  const { showToastPopup } = usePopup();
  const [currentBalloonId, setCurrentBalloonId] = useState<string>(
    initBalloonShortData._id,
  );
  const balloonDataRes = fetchBalloonDataById(currentBalloonId);
  const [currentBalloonData, setCurrentBalloonData] = useState<
    BalloonData | undefined
  >(balloonDataRes.data?.data);

  const [prevBalloonId, setPrevBalloonId] = useState<string>('');
  const [nextBalloonId, setNextBalloonId] = useState<string>('');

  const meProfileId = useAtomValue(meProfileIdAtom);
  const isOwnRoom = currentRoomInfo?.mine;
  const [notReadBalloonIds, setNotReadBalloonIds] = useAtom(
    notReadBalloonIdsAtom,
  );
  const writerIsMe = currentBalloonData?.writer_profile_id === meProfileId;
  const BalloonMessageListFullScreenModal = useModal(
    'BalloonMessageListFullScreenModal',
  );
  const [isOptionMenuShow, setIsOptionMenuShow] = useState(false);
  const BalloonReadFullScreenModal = useModal('BalloonReadFullScreenModal');
  const BalloonWriteFullScreenModal = useModal('BalloonWriteFullScreenModal');
  const ProfileFullScreenModal = useModal('ProfileFullScreenModal');
  const {
    data: balloonListData,
    fetchNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    hasNextPage,
  } = fetchBalloons(targetRoomProfileId, {
    myroom_id: targetRoomId,
    type: 'all',
    limit: 10,
    end: initBalloonShortData.stat.created,
  });

  const allBalloonMessages = React.useMemo(() => {
    return balloonListData?.pages.flatMap((page) => page?.list);
  }, [balloonListData]);

  useEffect(() => {
    setCurrentBalloonData(balloonDataRes.data?.data);
    if (
      isOwnRoom &&
      notReadBalloonIds.includes(balloonDataRes.data?.data._id ?? '')
    ) {
      const findIndex = notReadBalloonIds.findIndex(
        (id) => id === balloonDataRes.data?.data._id ?? '',
      );
      if (findIndex != -1) {
        notReadBalloonIds.splice(findIndex, 1);
        setNotReadBalloonIds(notReadBalloonIds);
      }
    }
  }, [balloonDataRes, notReadBalloonIds, setNotReadBalloonIds]);

  const [bottomMenus, setBottomMenus] = useState<ISelectButton[]>([]);
  useEffect(() => {
    if (!currentBalloonData) return;
    const newBottomMenus: ISelectButton[] = [];
    newBottomMenus.push(profileMenu);
    if (!writerIsMe) {
      newBottomMenus.push(reportMenu);
    }
    if (isOwnRoom || writerIsMe) {
      newBottomMenus.push(deleteMenu);
    }
    setPrevBalloonId(getPrevBalloonData()?._id ?? '');
    setNextBalloonId(getNextBalloonData()?._id ?? '');
    const currentBalloonIndex = findBalloonIndex(currentBalloonData);

    const allBalloonNum = allBalloonMessages?.length ?? 0;

    if (
      allBalloonNum > 0 &&
      allBalloonNum <= currentBalloonIndex + 1 &&
      hasNextPage
    ) {
      fetchNextPage();
    }
    if (currentBalloonIndex === 0 && hasPreviousPage) {
      fetchPreviousPage();
    }
    setBottomMenus(newBottomMenus);
  }, [
    currentBalloonData,
    allBalloonMessages,
    fetchNextPage,
    fetchPreviousPage,
  ]);

  const findBalloonIndex = useCallback(
    (balloonData: BalloonData | undefined) => {
      if (!allBalloonMessages || !balloonData) return -1;

      for (let i = 0; i < allBalloonMessages.length; i++) {
        if (allBalloonMessages[i]?._id === balloonData._id) {
          return i;
        }
      }
      return -1;
    },
    [allBalloonMessages],
  );

  const getPrevBalloonData = useCallback(() => {
    if (!allBalloonMessages || !currentBalloonData) {
      return undefined;
    }
    const findIndex = findBalloonIndex(currentBalloonData);
    if (findIndex <= -1 || findIndex == 0) {
      return undefined;
    }
    return allBalloonMessages[findIndex - 1];
  }, [currentBalloonData, allBalloonMessages, findBalloonIndex]);

  const getNextBalloonData = useCallback(() => {
    if (!allBalloonMessages || !currentBalloonData) {
      return undefined;
    }
    const findIndex = findBalloonIndex(currentBalloonData);
    if (findIndex <= -1 || allBalloonMessages.length <= findIndex + 1) {
      return undefined;
    }
    return allBalloonMessages[findIndex + 1];
  }, [currentBalloonData, allBalloonMessages, findBalloonIndex]);

  const handleDeleteBalloon = () => {
    patchBalloonsState(targetRoomId, [currentBalloonId], 'delete', true, () => {
      BalloonReadFullScreenModal.deleteModal();
    });
  };
  const handleReportBalloon = () => {
    showToastPopup({ titleText: '준비 중입니다.' });
  };

  const handleShowProfile = useCallback(() => {
    if (!currentBalloonData) return;
    setIsOptionMenuShow(false);
    ProfileFullScreenModal.createModal({
      isPage: false,
      profileId: currentBalloonData.writer_profile_id,
      isMine: writerIsMe,
    });
  }, [currentBalloonData, writerIsMe, ProfileFullScreenModal]);
  const handlePrevBalloon = useCallback(() => {
    if (!prevBalloonId) return;
    setCurrentBalloonId(prevBalloonId);
  }, [prevBalloonId]);
  const handleNextBalloon = useCallback(() => {
    if (!nextBalloonId) return;
    setCurrentBalloonId(nextBalloonId);
  }, [nextBalloonId]);
  const handleList = () => {
    let initListType = 'active';
    if (currentBalloonData && currentBalloonData.option.endts < Date.now()) {
      initListType = 'inactive';
    }

    if (BalloonMessageListFullScreenModal.isOpen)
      BalloonMessageListFullScreenModal.deleteModal();
    BalloonMessageListFullScreenModal.createModal({
      initListType: initListType,
    });

    onRequestClose();
  };
  const handleWrite = () => {
    BalloonWriteFullScreenModal.createModal({
      targetRoomId: targetRoomId,
    });
  };

  const profileMenu: ISelectButton = {
    icon: 'Profile_M',
    textId: 'GMY.000038',
    defaultValue: '프로필 보기',
    onClick: handleShowProfile,
  };
  const reportMenu: ISelectButton = {
    icon: 'Notify_M',
    textId: 'GCM.000021',
    defaultValue: '신고',
    onClick: handleReportBalloon,
  };
  const deleteMenu: ISelectButton = {
    icon: 'Post_Memo_Balloon_None',
    textId: 'GMY.000175',
    defaultValue: '풍선 제거',
    onClick: handleDeleteBalloon,
  };

  return {
    currentBalloonData,
    prevBalloonData: prevBalloonId,
    nextBalloonData: nextBalloonId,
    bottomMenus,
    handlePrevBalloon,
    handleNextBalloon,
    handleList,
    handleWrite,
    isOptionMenuShow,
    setIsOptionMenuShow,
  };
};
export default useBalloonReadFullScreenModal;
