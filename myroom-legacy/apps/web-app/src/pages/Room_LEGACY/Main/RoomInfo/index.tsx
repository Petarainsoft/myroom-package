import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  allPlacedFigureAtom,
  avatarInfoMapAtom,
  currentMyRoomIdAtom,
  meRoomIdAtom,
  uiStatusMsgShowAtom,
} from '@/common/stores';
import AvatarStatusMessage from './AvatarStatusMessage';
import useMe from '@/common/hooks/use-me';
import useAvatarAPI from '@/apis/Space/Avatar';
import AvatarNickname from './AvatarNickname';

import useRoomInfo from '../../useRoomInfo';

import ItemInfo from './ItemInfo';

import useItemMemoAPI from '@/apis/Social/ItemMemo';
import { IItemMemoListItem } from '@/apis/Social/ItemMemo/type';

import { SceneManager } from '@/common/utils/client';

const RoomInfo = (): React.ReactElement => {
  const { meProfileId } = useMe();
  const { roomOwnerProfileId } = useRoomInfo();
  const [avatarInfoMap, setAvatarInfoMap] = useAtom(avatarInfoMapAtom);
  const allPlacedFigure = useAtomValue(allPlacedFigureAtom);

  const [figureList, setFigureList] = React.useState<string[]>([]);
  const [roomItemList, setRoomItemList] = React.useState<string[]>([]);
  const [queryResolveFigure, setQueryResolveFigure] = React.useState(false);
  const { fetchAvatars } = useAvatarAPI();
  const figureListResult = fetchAvatars(figureList);
  const [currentRoomId] = useAtom(currentMyRoomIdAtom);
  const [meRoomId] = useAtom(meRoomIdAtom);

  const statusMsgShow = useAtomValue(uiStatusMsgShowAtom);

  const { fetchItemMemos } = useItemMemoAPI();

  const { data: MemoData } = fetchItemMemos({
    profile_id: meRoomId === currentRoomId ? 'me' : roomOwnerProfileId!,
    myroom_id: currentRoomId,
    isHome: true,
  });

  const MemoList = useMemo(() => {
    if (MemoData?.list && MemoData?.list.length > 0) {
      const idToObjectMap = MemoData.list.reduce((acc, item) => {
        acc[item.item_instance_id] = item;
        return acc;
      }, {} as Record<string, IItemMemoListItem>); // 여기서 타입을 명시적으로 지정
      return idToObjectMap;
    }
    return {};
  }, [MemoData]);

  /** 1. useRoom.ts에서 현재 배치 된 피규어리스트 받아와서 설정 */
  React.useEffect(() => {
    //피규어 리스트
    SceneManager.Room?.getAllFigureIds((ids) => setFigureList(ids));
    //아이템 리스트
    SceneManager.Room?.getAllItemInstanceIds((ids) => {
      // const convertValues = ids.map((uuid) => uuidToBase62V2(uuid));
      // setRoomItemList(convertValues);
      setRoomItemList(ids);
    });

    // console.log('ItemInfo서윤', ItemUrl);
    return () => {
      setQueryResolveFigure(false);
    };
  }, [allPlacedFigure]);

  /** 2. useQueries 의 모든 API 결과 완료시점 설정 */
  React.useEffect(() => {
    if (figureList.length === 0 && !queryResolveFigure) return; // queryResolveFigure 뺄 시 무한루프 주의
    const successCheck = figureListResult.every(
      (result) => result.status === 'success',
    );
    if (successCheck) setQueryResolveFigure(true);
  }, [figureListResult]);

  /** 2. 모든 API 결과 완성 시점에서 아바타 맵 만들기 */
  React.useEffect(() => {
    const combinedData = figureListResult.map((result) => result.data);
    const avatarInfo: any = {};
    combinedData.map((avatar) => {
      if (!avatar || avatar === null) return;
      if (avatar.data) {
        avatarInfo[avatar.data._id] = {
          profileId: avatar.data.profile_id,
          version: avatar.data.option.version,
        };
      }
    });
    setAvatarInfoMap(avatarInfo);
  }, [queryResolveFigure]);

  return (
    <>
      {Object.keys(avatarInfoMap).map((key: string, idx) => (
        <div key={idx}>
          {statusMsgShow ? (
            <AvatarStatusMessage
              key={`status-${key}`}
              id={key}
              profileId={
                avatarInfoMap[key]?.profileId === meProfileId
                  ? 'me'
                  : avatarInfoMap[key]?.profileId
              }
            />
          ) : (
            <></>
          )}

          <AvatarNickname
            key={`nickname-${key}`}
            isShow={statusMsgShow}
            id={key}
            profileId={avatarInfoMap[key]?.profileId}
          />
        </div>
      ))}
      {roomItemList.map((id, idx) => {
        const item = MemoList[id];
        return <ItemInfo id={id} key={idx} text={item?.txt.contents} />;
      })}
    </>
  );
};

export default RoomInfo;
