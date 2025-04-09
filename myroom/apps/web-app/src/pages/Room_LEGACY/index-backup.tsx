import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { uiAppBarAtom, uiHomeZoomInAtom, uiPlaceModeAtom } from '@/common/stores';
import RoomScene from './RoomScene';
import Header from '../Room_LEGACY/Main/Header';
import PlaceModeHeader from '../Room_LEGACY/PlaceMode/Header';
import { SceneManager } from '@/common/utils/client';
import useRoom from './useRoom';
import useSelectionEvent from './useSelectionEvent';

const Room = () => {
  const uiAppBar = useAtomValue(uiAppBarAtom);
  const placeMode = useAtomValue(uiPlaceModeAtom);
  const setIsZoomIn = useSetAtom(uiHomeZoomInAtom);
  useRoom();
  useSelectionEvent();

  React.useEffect(() => { 
    if (SceneManager.isInit('ROOM')) {
      SceneManager.Room?.addCameraDistanceChangeEventHandler((dist) => {
        if (dist < 0.98) setIsZoomIn(true);
        else setIsZoomIn(false);
      });
    }

    return () => {
      if (SceneManager.isInit('ROOM')) {
        SceneManager.Room?.clearDistanceChangeEventHandler();
      }
    };
  }, []);

  return (
    // <FixedView
    //   disableNavigation={uiAppBar}
    //   headerOptions={{disabled:false, element: placeMode ? <PlaceModeHeader /> : <Header />}}
    // >
    //   <RoomScene />
    //   <Outlet />
    // </FixedView>
    <></>
  );
};

export default Room;
