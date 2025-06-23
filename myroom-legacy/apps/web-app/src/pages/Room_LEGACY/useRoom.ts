import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtom, useSetAtom } from 'jotai';
import {
  currentMyRoomIdAtom,
  uiPlaceModeAtom,
  uiAppBarAtom,
  myRoomBgColorAtom,
  allPlacedFigureAtom,
  isInitializedRoomSceneAtom,
  initialRoomManifestAtom,
  uiSignInSheetAtom,
  isPlaceModeRefreshedAtom,
  selectedSkinAtom,
  initialColorIdxAtom,
  roomObjectAtom,
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import { auth } from '@/common/utils/auth';
import useAuth from '@/common/hooks/use-auth';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import { selectionCallback } from '@/pages/Room_LEGACY/callbackHelper';
import { IDataWebColors } from 'client-core/tableData/defines/System_InternalData';
import { t } from 'i18next';
import usePopup from '@/common/hooks/Popup/usePopup';
import { SceneManager } from '@/common/utils/client';
import useModal from '@/common/hooks/Modal/useModal';

const useRoom = (checkLogin: boolean = true, serviceType?: string) => {
  const { isLogined } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // auth.clearCredential();
  /**
   * love8 / 1111 
   * 7Xy8VujCiYCEWWZSuVttA
   * 
   * hana1 
   * mid /rooms/BJxEs2ygYvukSYl7JVQlU
   * pid /profiles/3lz8WxIZmID0bBExA96zg
   * 
   * hana2 
   * /rooms/F5wEOFMyJdSmJw7r3RTns
   * /profiles/7XyBXZFiFCG6laLn9tp9E
   * 
   * hana3
   * /rooms/IrvIbY09I2NhuVpjqhmVs
   * /profiles/3lz36hKRKD5360HDVTeJU
   * 
  */
  
  const loadingFullScreenModal = useModal("LoadingFullScreenModal");
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const [myRoomVersion, setMyRoomVersion] = React.useState(1);
  const [myRoomId, setMyRoomId] = React.useState(''); // myroom, manifest.json 경로
  const setUISignInSheet = useSetAtom(uiSignInSheetAtom);
  const [isPlaceModeRefreshed, setPlaceModeRefreshed] = useAtom(
    isPlaceModeRefreshedAtom,
  );
  const setSelectedSkin = useSetAtom(selectedSkinAtom);
  const setIsInitializedRoomScene = useSetAtom(isInitializedRoomSceneAtom);
  const setInitialColorIdx = useSetAtom(initialColorIdxAtom);
  const [currentRoomId, setCurrentRoom] = useAtom(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
  const setUiPlaceMode = useSetAtom(uiPlaceModeAtom);
  const setMyRoomBgColor = useSetAtom(myRoomBgColorAtom);
  const setAllPlacedFigure = useSetAtom(allPlacedFigureAtom);
  const setRoomObjects = useSetAtom(roomObjectAtom);

  const { fetchMyroom, fetchMyroomManifest, fetchMyroomsMe } = useMyRoomAPI();
  const { data: myRoomData } = fetchMyroom(currentRoomId);
  const {
    data: myRoomManifestData,
    refetch: refetchMyRoomManifest
  } = fetchMyroomManifest(
    myRoomId,
    myRoomVersion,
  );
  const { data: myRoomListData, refetch: refetchMyRoomList } = fetchMyroomsMe();
  const setInitialRoomManifest = useSetAtom(initialRoomManifestAtom);

  const { showToastPopup } = usePopup();

  React.useEffect(() => {
    const isRefreshed = auth.getRefreshToken();
    const loadingCheck = sessionStorage.getItem('RoomLoadCheck');
    sessionStorage.setItem('RoomLoadCheck', '1');
    setIsInitializedRoomScene(false);

    const pathArray = location.pathname.split('/');
    const uriIdExist = pathArray.length >= 3;

    if (!uriIdExist && !loadingCheck) {
      refetchMyRoomList(); // 최초 진입 시, 마이룸 불러오기
    }

    if (checkLogin) {
      /** FIXME: 디버깅용 코드 / 비로그인 진입 테스트 시 비활성화해야함 */
      if (isRefreshed === null && !isLogined) {
        setTimeout(() => {
          navigate('/auth/signIn');
        }, 300);
      }
    }

    return () => {
      sessionStorage.removeItem('RoomLoadCheck');
      SceneManager.finalize('ROOM');
    }
  }, []);

  React.useEffect(() => {
    if (isLogined) {
      refetchMyRoomList();
    }

    const pathArray = location.pathname.split('/');
    const uriIdExist = pathArray.length >= 3;
    const roomId = uriIdExist ? pathArray[2] : '';

    if (!isLogined && uriIdExist) {
      // 비로그인 마이룸 접근
      setCurrentRoom(roomId);
      //setUriMyRoomId(roomId);
      setUISignInSheet(true);
    }

    if (!myRoomListData || !myRoomListData.list) return;

    if (isLogined && !uriIdExist) {
      // 로그인 상태, 마이룸 새로고침
      setCurrentRoom(myRoomListData.list[0]._id);
      //setIsOwnRoom(true);
    }
    else if (roomId === 'placemode') {
      // 로그인 상태, 마이룸/배치모드 새로고침
      setCurrentRoom(myRoomListData.list[0]._id);
      setUiPlaceMode(true);
      hideAppBar(true);
      setPlaceModeRefreshed(!isPlaceModeRefreshed); // 배치모드 새로고침 시, 포인터 클릭 활성화
    }
    else if (uriIdExist && roomId !== 'placemode') {
      if (roomId === myRoomListData.list[0]._id) {
        // 로그인 상태, 마이룸 아이디 접근 / 본인 마이룸 접근 시
        setCurrentRoom(myRoomListData.list[0]._id);
        // setUriMyRoomId(myRoomListData.list[0]._id);
        // setIsOwnRoom(true);
      } else {
        // 로그인 상태, 마이룸 아이디 접근 / 타인 마이룸 접근 시
        setCurrentRoom(roomId);
        // setUriMyRoomId(roomId);
        // setIsOwnRoom(false);
      }
    }

  }, [myRoomListData, isLogined]);


  React.useEffect(() => {
    logger.log('Effect 3 ', myRoomData)
    try {
      if (!myRoomData) return;
      if (myRoomData.data) {
        setMyRoomId(myRoomData.data._id);
        setMyRoomVersion(myRoomData.data.option.version);
        //setCurrentRoomProfileId(myRoomData.data.profile_id); // 로그인 & 타인의 룸 방문 경우, 타인 룸의 프로필 아이디
      } else {
        // 마이룸 로딩 실패 모달 표시
      }
    } catch (error) {
      logger.log('roomManifest Exception ');
    }
  }, [myRoomData]);

  React.useEffect(() => {
    logger.log('Effect 4 ', `id: [${myRoomId}]`, `version: [${myRoomVersion}]`);
    if (myRoomId === '') return;
    refetchMyRoomManifest();
  }, [myRoomId, myRoomVersion]);

  
  React.useEffect(() => {
    loadingFullScreenModal.createModal({});

    return () => { 
      if (loadingFullScreenModal.isOpen) {
        loadingFullScreenModal.deleteModal();
      }
    };
  }, []);
  
  React.useEffect(() => {
    logger.log('roomManifest ', myRoomManifestData);

    /** 룸 생성 */
    if (myRoomManifestData?.main) {
      setMyRoomBgColor(myRoomManifestData.main.room.backgroundColor);
      Object.values(IDataWebColors).map((color) => {
        // logger.log('BUG1 ', color)
        // logger.log('BUG2 ', color.hex)
        // logger.log('BUG3 ', myRoomManifestData!.main.room.backgroundColor)
        if (color.hex === myRoomManifestData!.main.room.backgroundColor) {
          logger.log('BUG4 ', color.ID)
          setInitialColorIdx(color.ID);
          return;
        }
      });

      // logger.log('SceneManager ', SceneManager.Room)
      SceneManager.Room?.clearMyRoom();
      // @ts-ignore
      SceneManager.Room?.initializeMyRoom(myRoomManifestData, false, () => {
        setIsInitializedRoomScene(true);

        logger.log('roomManifest manifest ', myRoomManifestData);
        logger.log('roomManifest myRoomId TEST1 ', myRoomId);
        logger.log('roomManifest ver ', myRoomVersion);

        /** 홈 아이템에서 마이룸 배치하기에서 연결될 경우 */
        if (location.search) {
          const itemId = location.search.split('=')[1];
          SceneManager.Room?.startMyRoomPlacementMode();
          SceneManager.Room?.placeNewItem({
            itemId: itemId,
            callback: (_id) => {
              if (_id === '')
                showToastPopup({ titleText: t('배치 공간이 부족합니다.') });
              SceneManager.Room?.getAllItemIds((ids) => setRoomObjects(ids));
            },
          });
        }

        if (isPlaceModeRefreshed) {
          SceneManager.Room?.startMyRoomPlacementMode();
        }
        SceneManager.Room?.getAllFigureIds((ids) => setAllPlacedFigure(ids)); // 상태메시지용 아바타맵 처리 RoomInfo
        SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
          selectionCallback,
        );
        setSelectedSkin(myRoomManifestData.main.room.roomSkinId);

        SceneManager.Room?.makeMyRoomManifest((manifest) => {
          setInitialRoomManifest(manifest);
        });

        if (loadingFullScreenModal.isOpen) {
          loadingFullScreenModal.deleteModal();
        }
      }, serviceType);

    } else {
      logger.log('myRoomManifestData Changed No Data ', myRoomManifestData);
    }
  }, [myRoomManifestData]);
};

export default useRoom;
