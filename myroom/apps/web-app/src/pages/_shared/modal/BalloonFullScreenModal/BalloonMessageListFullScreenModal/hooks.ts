import useBalloonsAPI from '@/apis/Social/Balloons';
import {
  BALLOON_LIST_TYPE,
  BallonListTypes,
  BalloonData,
} from '@/apis/Social/Balloons/type';
import useModal from '@/common/hooks/Modal/useModal';
import {
  balloonListFilterFlagAtom,
  balloonListOrderByDescAtom,
  balloonListUIModeAtom as balloonListUIModeAtom,
  selectedBalloonMessageListIdsAtom,
} from '@/common/stores';
import { useAtom, useAtomValue } from 'jotai';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import useBalloonsPatch from '../Hooks/useBalloonsPatch';
import usePopup from '@/common/hooks/Popup/usePopup';
import { t } from 'i18next';
import { parseTagString } from '@/common/utils/text';
import { Filter } from './BalloonMessageListOptionUI';
import useRoom from '@/common/hooks/use-room';
import useMe from '@/common/hooks/use-me';

export enum eBalloonListUIMode {
  View = 0,
  Edit,
}

const useBalloonMessageListFullScreenModal = (
  initialListType: 'active' | 'inactive',
) => {
  const { meRoomId, meProfileId }  = useMe();
  const { currentRoomInfo } = useRoom();
  const MAX_SELECT_BALLOON_NUM = 200;
  const MAX_ONE_REQUEST_NUM = 2;
  const { showAlertPopup } = usePopup();
  const { patchBalloonsState } = useBalloonsPatch();
  const { ref: inViewRef, inView } = useInView();
  const [listType, setListType] = useState<BALLOON_LIST_TYPE>(initialListType); // 풍선함 : active, 보관함 : inactive.
  const isOwnRoom = currentRoomInfo?.mine;
  const uriMyRoomId = currentRoomInfo?.id;
  const currentRoomProfileId = currentRoomInfo?.ownerId;
  const targetRoomId = isOwnRoom ? meRoomId : uriMyRoomId;
  const targetRoomProfileId = isOwnRoom ? 'me' : currentRoomProfileId;
  const {
    data: balloonsRes,
    fetchNextPage,
    hasNextPage,
  } = useBalloonsAPI().fetchBalloons(targetRoomProfileId!, {
    myroom_id: targetRoomId ?? '',
    type: listType,
  });

  const [balloonMessageList, setBalloonMessageList] =
    useState<(BalloonData | undefined)[]>();

  const [totalMessageNum, setTotalMessageNum] = useState(0);
  const [filteredMessageNum, setFilteredMessageNum] = useState(0);
  const [balloonListUIMode, setBalloonListUIMode] = useAtom(
    balloonListUIModeAtom,
  );

  const [selectedBalloonMessageIds, setSelectedBalloonMessageIds] = useAtom(
    selectedBalloonMessageListIdsAtom,
  );
  const selectedBalloonMessageNum = useMemo(() => {
    return selectedBalloonMessageIds.length;
  }, [selectedBalloonMessageIds]);

  const BalloonReadFullScreenModal = useModal('BalloonReadFullScreenModal');
  const BalloonWriteFullScreenModal = useModal('BalloonWriteFullScreenModal');
  const balloonListFilterFlag = useAtomValue(balloonListFilterFlagAtom);
  const balloonListOrderByDesc = useAtomValue(balloonListOrderByDescAtom);

  useEffect(() => {
    if (!balloonsRes || !balloonsRes.pages) return;
    const newList: BalloonData[] = [];
    const balloonListFilterMe =
      (balloonListFilterFlag & Filter.Me) === Filter.Me;
    const balloonListFilterNotRead =
      (balloonListFilterFlag & Filter.NotRead) === Filter.NotRead;

    balloonsRes.pages.map((page) => {
      if (page) {
        newList.push(
          ...page.list.filter((item) => {
            let result = true;
            if (balloonListFilterMe)
              result = item.writer_profile_id === meProfileId;
            if (result && balloonListFilterNotRead)
              result = item.stat.owner_view === false;
            return result;
          }),
        );
      }
    });

    if (balloonListOrderByDesc) {
      newList.sort((a, b) => {
        if (a && b) return b.stat.created - a.stat.created;
        else return 0;
      });
    } else {
      newList.sort((a, b) => {
        if (a && b) {
          return a.stat.created - b.stat.created;
        } else {
          return 0;
        }
      });
    }
    setTotalMessageNum(balloonsRes.pages.flatMap((page) => page?.list).length);
    setFilteredMessageNum(newList.length);
    setBalloonMessageList(newList);
  }, [
    balloonsRes,
    meProfileId,
    balloonListFilterFlag,
    balloonListOrderByDesc,
    setTotalMessageNum,
    setFilteredMessageNum,
    setBalloonMessageList,
  ]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleListTypeButton = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget) {
        return;
      }
      const type = e.currentTarget.value as BALLOON_LIST_TYPE;
      if (BallonListTypes.includes(type)) {
        setListType(type);
      }
    },
    [],
  );
  const handleSetUIMode = useCallback((mode: eBalloonListUIMode) => {
    setBalloonListUIMode(mode);
    setSelectedBalloonMessageIds([]);
  }, []);

  const handleClickMessageCell = useCallback(
    (data: BalloonData) => {
      if (balloonListUIMode === eBalloonListUIMode.Edit) {
        const isSelected = selectedBalloonMessageIds.includes(data._id);
        if (isSelected)
          setSelectedBalloonMessageIds((prev) =>
            prev.filter((id) => id !== data._id),
          );
        else {
          if (selectedBalloonMessageIds.length >= MAX_SELECT_BALLOON_NUM) {
            showAlertPopup({ titleText: t('GMY.000168') }); // 최대 200개까지 선택 가능합니다.
            return;
          }
          setSelectedBalloonMessageIds((prev) => [...prev, data._id]);
        }
      } else {
        BalloonReadFullScreenModal.createModal({
          targetRoomProfileId: targetRoomProfileId,
          targetRoomId: targetRoomId,
          balloonData: data,
        });
      }
    },
    [balloonListUIMode, selectedBalloonMessageIds],
  );

  const handleClickBalloonWrite = useCallback(() => {
    BalloonWriteFullScreenModal.createModal({ targetRoomId: targetRoomId });
  }, [BalloonWriteFullScreenModal]);

  const handleClickSelectAllMessage = useCallback(() => {
    if (!balloonMessageList) {
      return;
    }
    const balloonIds: string[] = [];
    balloonMessageList.map((data) => {
      if (data) balloonIds.push(data._id);
    });

    if (balloonIds.length > MAX_SELECT_BALLOON_NUM) {
      const titleText = parseTagString(
        `${t('GMY.000168')}<br/>${t('GMY.000169')}`,
      ); // 최대 200개까지 선택 가능합니다.  1~200번째 항목까지 선택됩니다.
      showAlertPopup({ titleText: titleText });
      balloonIds.splice(
        MAX_SELECT_BALLOON_NUM,
        balloonIds.length - MAX_SELECT_BALLOON_NUM,
      );
    }
    setSelectedBalloonMessageIds(balloonIds);
  }, [balloonMessageList]);

  const handleClickUnSelectAllMessage = useCallback(() => {
    setSelectedBalloonMessageIds([]);
  }, []);

  const handleClickInactive = useCallback(() => {
    if (selectedBalloonMessageIds.length <= 0 || !targetRoomId) return;
    patchBalloonsState(
      targetRoomId,
      selectedBalloonMessageIds,
      'inactivate',
      true,
      () => {
        setSelectedBalloonMessageIds([]);
      },
    );
  }, [selectedBalloonMessageIds, patchBalloonsState]);
  const handleClickActive = useCallback(() => {
    if (selectedBalloonMessageIds.length <= 0 || !targetRoomId) return;
    patchBalloonsState(
      targetRoomId,
      selectedBalloonMessageIds,
      'activate',
      true,
      () => {
        setSelectedBalloonMessageIds([]);
      },
    );
  }, [selectedBalloonMessageIds, patchBalloonsState]);
  const handleClickDelete = useCallback(() => {
    if (selectedBalloonMessageIds.length <= 0 || !targetRoomId) return;
    patchBalloonsState(
      targetRoomId,
      selectedBalloonMessageIds,
      'delete',
      true,
      () => {
        setSelectedBalloonMessageIds([]);
      },
    );
  }, [selectedBalloonMessageIds, patchBalloonsState]);

  const handleClickSetAllRead = useCallback(() => {
    const balloonIds = balloonMessageList
      ?.filter((data) => data?.stat.owner_view === false)
      .map((data) => data && data._id) as string[];
    if (!balloonIds || balloonIds.length <= 0) return;

    patchBalloonsRead(balloonIds);
  }, [balloonMessageList]);
  const patchBalloonsRead = (balloonIds: string[]) => {
    if (!balloonIds || balloonIds.length <= 0 || !targetRoomId) return;
    const targetIds = balloonIds.slice(0, MAX_ONE_REQUEST_NUM);
    patchBalloonsReadBody(targetIds, () => {
      balloonIds.splice(0, targetIds.length);
      patchBalloonsRead(balloonIds);
    });
  };
  const patchBalloonsReadBody = (
    balloonIds: string[],
    callback: () => void,
  ) => {
    if (balloonIds.length <= 0 || !targetRoomId) return;

    patchBalloonsState(targetRoomId, balloonIds, 'read', true, callback);
  };
  return {
    isOwnRoom,
    listType,
    balloonListUIMode,
    inViewRef,
    totalMessageNum,
    filteredMessageNum,
    selectedBalloonMessageNum,
    balloonMessageList,
    handleSetUIMode,
    handleListTypeButton,
    handleClickMessageCell,
    handleClickBalloonWrite,
    handleClickSelectAllMessage,
    handleClickUnSelectAllMessage,
    handleClickInactive,
    handleClickActive,
    handleClickDelete,
    handleClickSetAllRead,
  };
};
export default useBalloonMessageListFullScreenModal;
