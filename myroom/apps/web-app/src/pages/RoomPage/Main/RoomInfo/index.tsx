import React, { useState } from 'react';



import { IMyRoomItemPlacementInfo } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom';
import AvatarInfo from './AvatarInfo';
import useRoom from '@/common/hooks/use-room';
import { SceneManager } from '@/common/utils/client';
import ItemInfo from './ItemInfo';

export interface FigureInfo {
  avatarId: string,
  isAvatar: boolean,
}

const RoomInfo = (): React.ReactElement => {
  const { currentRoomInfo, recommendFiguresIds } = useRoom();
  const [figureList, setFigureList] = useState<FigureInfo[]>();
  const [itemList, setItemList] = useState<IMyRoomItemPlacementInfo[]>();

  React.useEffect(() => {
    SceneManager.Room?.makeMyRoomManifest((manifast) => {
        if (manifast?.main.items) {
          setItemList([...manifast.main.items]);
        }
        
      if (manifast?.main.figures) {
          const recommendFigures = recommendFiguresIds.map(x => { return { avatarId: x, isAvatar: false } });
          const roomFigures = manifast.main.figures.map(x => { return { avatarId: x.avatarId, isAvatar: x.isAvatar } });
        
          setFigureList([...roomFigures, ...recommendFigures]);
        }
    });
   }, [currentRoomInfo, recommendFiguresIds]);

  return <React.Fragment key={currentRoomInfo?.id}>
    {figureList?.map(figure => <React.Fragment>
      <AvatarInfo key={figure.avatarId} id={figure.avatarId} isAvatar={figure.isAvatar} />
    </React.Fragment>)}
    {itemList?.map(item => <React.Fragment>
      <ItemInfo key={item.instanceId} id={item.instanceId}/>
    </React.Fragment>)}
  </React.Fragment>
};

export default RoomInfo;
