import useBalloonsAPI from '@/apis/Social/Balloons';
import {
  createdBalloonDataAtom,
  needRefetchRoomBalloonsAtom,
  notReadBalloonIdsAtom,
} from '@/common/stores';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { FloatingBalloonData } from './Balloon';
import useModal from '@/common/hooks/Modal/useModal';
import usePopup from '@/common/hooks/Popup/usePopup';
import useRoom from '@/common/hooks/use-room';
import useMe from '@/common/hooks/use-me';
const MAX_FLOATING_NUM = 30;
export const BALLOON_WIDTH = 120; // Balloon/style.module.scss 의 balloonRoot 의 width와 동일해야 한다.
const useBalloonLayer = () => {
  const BalloonReadFullScreenModal = useModal('BalloonReadFullScreenModal');
  const createdBalloonData = useAtomValue(createdBalloonDataAtom);
  const [needRefetchRoomBalloons, setNeedRefetchRoomBalloons] = useAtom(
    needRefetchRoomBalloonsAtom,
  );
  const {  currentRoomInfo } = useRoom();
  const { meRoomId } = useMe();
  const isOwnRoom = currentRoomInfo?.mine;
  const uriMyRoomId = currentRoomInfo?.id;
  const targetRoomId = isOwnRoom ? meRoomId : uriMyRoomId;
  const currentRoomProfileId = currentRoomInfo?.ownerId;
  const targetRoomProfileId = isOwnRoom ? 'me' : currentRoomProfileId;
  const setNotReadBalloonIds = useSetAtom(notReadBalloonIdsAtom);
  const { showToastPopup } = usePopup();
  const { data: balloonRes, refetch: balloonsRefetch } =
    useBalloonsAPI().fetchBalloons(targetRoomProfileId!, {
      myroom_id: targetRoomId ?? '',
      type: 'myroom',
      limit: 200,
    });
  const balloonList = balloonRes?.pages[0]?.list;

  const [floatingBalloons, setFloatingBalloons] = useState<
    FloatingBalloonData[]
  >([]);
  const maxFloatingNum = Math.min(MAX_FLOATING_NUM, balloonList?.length ?? 0);
  const [isReady, setIsReady] = useState(false);
  const maxWidth = parseInt(
    document.documentElement.style.getPropertyValue('--max-width'),
  );
  const leftWindowMargin = Math.max(0, window.innerWidth - maxWidth) / 2;
  useEffect(() => {
    if (needRefetchRoomBalloons) {
      setIsReady(false);
      balloonsRefetch().then(() => {
        setIsReady(true);
        setNeedRefetchRoomBalloons(false);
      });
    } else {
      setIsReady(true);
    }
  }, [needRefetchRoomBalloons, setIsReady, setNeedRefetchRoomBalloons]);
  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (maxFloatingNum <= 0) {
      setFloatingBalloons([]);
      setNotReadBalloonIds([]);
      return;
    }
    // 내 room 이면 새로 띄워진 풍선이 있는지 체크.
    if (isOwnRoom && balloonList) {
      const now = Date.now();
      const sevenDays = 3600 * 12 * 7 * 1000;
      for (let i = 0; i < balloonList.length; ++i) {
        console.log(
          'calc Date : ',
          now - balloonList[i].stat.created,
          ' balloonList[i].stat.owner_view : ',
          balloonList[i].stat.owner_view,
          ' sevenDays : ',
          sevenDays,
        );
        if (
          !balloonList[i].stat.owner_view &&
          now - balloonList[i].stat.created < sevenDays
        ) {
          setNotReadBalloonIds((prev) => [...prev, balloonList[i]._id]);
        }
      }
    }

    const randomPosY: number[] = [5, 10, 15];
    const randomPosX: number[] = [];
    const innerWidth =
      window.innerWidth - leftWindowMargin * 2 - BALLOON_WIDTH / 2;
    for (let i = 0; i < maxFloatingNum; ++i) {
      const ratio = (1 / maxFloatingNum) * i;
      randomPosX[i] = innerWidth * ratio - BALLOON_WIDTH / 4;
    }
    randomPosX.sort(() => Math.random() - 0.5);
    balloonList?.sort(() => Math.random() - 0.5);
    const newFloatingBalloons: FloatingBalloonData[] = [];
    let randomBalloonNum = maxFloatingNum;
    if (createdBalloonData) {
      showToastPopup({
        titleText: '풍선이 날려졌습니다. 7일간 마이룸에 무작위로 노출됩니다.',
      });
      --randomBalloonNum;
      newFloatingBalloons.push({
        balloonItemId: createdBalloonData.balloon_item_id,
        balloonId: createdBalloonData._id,
        showNewBadge: false,
        balloonData: createdBalloonData,
        left: randomPosX[randomBalloonNum],
        top: randomPosY[randomBalloonNum],
        state: 'appear',
      });
    }
    if (balloonList) {
      let createNum = 0;
      for (let i = 0; i < balloonList.length; ++i) {
        if (randomBalloonNum <= createNum) break;
        if (createdBalloonData && balloonList[i]._id === createdBalloonData._id)
          continue;
        newFloatingBalloons.push({
          balloonItemId: balloonList[i].balloon_item_id,
          balloonId: balloonList[i]._id,
          showNewBadge: false,
          balloonData: balloonList[i],
          left: randomPosX[createNum],
          top: randomPosY[createNum],
          state: 'idle',
        });
        ++createNum;
      }
    }

    setFloatingBalloons(newFloatingBalloons);
  }, [
    maxFloatingNum,
    balloonList,
    createdBalloonData,
    isReady,
    setFloatingBalloons,
    setNotReadBalloonIds,
  ]);

  const handleBalloonPopped = useCallback(
    (data: FloatingBalloonData) => {
      BalloonReadFullScreenModal.createModal({
        targetRoomProfileId: targetRoomProfileId,
        targetRoomId: targetRoomId,
        balloonData: data.balloonData,
      });
    },
    [targetRoomProfileId, targetRoomId],
  );
  return { floatingBalloons, handleBalloonPopped };
};
export default useBalloonLayer;
