import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  uiPlaceModeAtom,
  uiAppBarAtom,
  uiHomeZoomInAtom,
  meProfileIdAtom,
  uiStatusMsgShowAtom,
  notReadBalloonIdsAtom,
} from '@/common/stores';
import { SceneManager } from '@/common/utils/client';
import useAuth from '@/common/hooks/use-auth';
import { logger } from '@/common/utils/logger';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import usePopup from '@/common/hooks/Popup/usePopup';
import useModal from '@/common/hooks/Modal/useModal';
import TextBadge from '@/pages/_shared/ui/TextBadge';
import Toggle from '@/components/Toggle/Toggle';
import style from './style.module.scss';
import useRoom from '@/common/hooks/use-room';

const BottomUI = (): React.ReactElement => {
  const { currentRoomInfo } = useRoom();
  const { isLogined } = useAuth();
  const navigate = useNavigate();
  const setPlaceMode = useSetAtom(uiPlaceModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const [statusMsgShow, setStatusMsgShow] = useAtom(uiStatusMsgShowAtom);
  const isZoomIn = useAtomValue(uiHomeZoomInAtom);
  const notReadBalloonIds = useAtomValue(notReadBalloonIdsAtom);
  const { showToastPopup } = usePopup();
  const BalloonMessageListFullScreenModal = useModal(
    'BalloonMessageListFullScreenModal',
  );
  const [isMine, setIsMine] = React.useState(true);
  const currentRoomProfileId = currentRoomInfo?.ownerId;
  const meProfileId = useAtomValue(meProfileIdAtom);

  const openPlaceMode = () => {
    setPlaceMode(true);
    hideAppBar(true);
    navigate('/home/placemode');
  };

  const handleResize = () => {
    logger.log('handleResize, set default resolution');
    if (SceneManager.isInit('ROOM')) {
      SceneManager.Room?.setCameraDist(1);
    }
  };

  const showPreparingToast = () => {
    showToastPopup({ titleText: '준비 중입니다.' });
  };

  const handleBalloonList = () => {
    BalloonMessageListFullScreenModal.createModal({});
  };

  const handleStatusMsgToggle = () => {
    setStatusMsgShow(!statusMsgShow);
  }

  React.useEffect(() => {
    if (meProfileId && currentRoomProfileId) {
      if (meProfileId === currentRoomProfileId) setIsMine(true);
      else setIsMine(false);
    }
  }, [currentRoomProfileId, meProfileId]);

  const NoneMemberBottom = (): React.ReactElement => {
    return (
      <>
        {isZoomIn && (
          <div className={`${style.opacityWrapper}`}>
            <CircleButton
              onClick={handleResize}
              className={style.dimension}
              shape="circle"
              size="m"
            >
              <Icon name={`Area`} />
            </CircleButton>
          </div>
        )}
        <div className={style.cameramode} onClick={showPreparingToast}>
          <CircleButton
            className={style.dimension}
            shape="circle"
            size="m"
            variant="black"
          >
            <Icon name={`Camera`} />
          </CircleButton>
        </div>
        <div className={style.commentNplacemode} onClick={handleBalloonList}>
          <CircleButton className={style.dimension} shape="circle-bl" size="m">
            <Icon name={`Post_Memo_Balloon`} />
          </CircleButton>
        </div>
      </>
    );
  };

  const MemberBottom = (): React.ReactElement => {
    return (
      <>
        {isZoomIn && (
          <div className={`${style.opacityWrapper}`}>
            <CircleButton
              onClick={handleResize}
              className={style.dimension}
              shape="circle"
              size="m"
            >
              <Icon name={`Area`} />
            </CircleButton>
          </div>
        )}
        <div className={style.toggleStatusMsg}>
          <Toggle 
            isActive={statusMsgShow}
            handleIsActive={handleStatusMsgToggle}
            // isActive={isMarket ? isMarket : false}
            // handleIsActive={handleToggle}
          />
        </div>
        <div className={style.commentNplacemode}>
          {isMine ? (
            <CircleButton
              shape="circle-bl"
              onClick={openPlaceMode}
              className={`${style.dimension} ${style.botMargin}`}
              size="m"
            >
              <Icon name={`Share`} />
            </CircleButton>
          ) : (
            <></>
          )}
          <div style={{ position: 'relative' }}>
            <CircleButton
              shape="circle-bl"
              className={style.dimension}
              onClick={handleBalloonList}
              size="m"
            >
              <Icon name={`Post_Memo_Balloon`} />
            </CircleButton>
            {notReadBalloonIds.length > 0 ? (
              <TextBadge text="N" className={style.balloonNewBadge} />
            ) : (
              ''
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <React.Fragment>
      {isLogined ? <MemberBottom /> : <NoneMemberBottom />}
    </React.Fragment>
  );
};

export default BottomUI;
