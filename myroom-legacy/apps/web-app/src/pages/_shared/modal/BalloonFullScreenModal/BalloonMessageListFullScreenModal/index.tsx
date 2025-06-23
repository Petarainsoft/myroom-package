import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import titleStyle from '../titleStyle.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Button from '@/components/Buttons/Button';
import { useCallback, useState } from 'react';
import BalloonMessageListOpitonUI from './BalloonMessageListOptionUI';
import useBalloonMessageListFullScreenModal, {
  eBalloonListUIMode,
} from './hooks';
import Text from '@/components/Text';
import BalloonMessageCell from './BalloonMessageCell';
import ToolTip from '@/pages/_shared/ui/ToolTip';
import CircleButton from '@/components/Buttons/CircleButton';
import { t } from 'i18next';
interface IBalloonMessageListFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  initialListType: 'active' | 'inactive';
}

const BalloonMessageListFullScreenModal = ({
  initialListType = 'active',
  onRequestClose,
}: IBalloonMessageListFullScreenModal) => {
  const {
    isOwnRoom,
    listType,
    balloonListUIMode,
    handleSetUIMode,
    totalMessageNum,
    filteredMessageNum,
    selectedBalloonMessageNum,
    inViewRef,
    balloonMessageList,
    handleListTypeButton,
    handleClickMessageCell,
    handleClickBalloonWrite,
    handleClickSelectAllMessage,
    handleClickUnSelectAllMessage,
    handleClickInactive,
    handleClickActive,
    handleClickDelete,
    handleClickSetAllRead,
  } = useBalloonMessageListFullScreenModal(initialListType);
  const [isOptionUIOpen, setIsOptionUIOpen] = useState(false);
  const [isShowToolTip, setIsShowToolTip] = useState(false);
  //** Header */
  const Header = [];
  Header[eBalloonListUIMode.View] = useCallback(() => {
    return (
      <div className={titleStyle.title}>
        <div className={titleStyle.leftSide}>
          <CustomButton className={titleStyle.btnBack} onClick={onRequestClose}>
            <Icon name="Top_Arrow_left_M" />
          </CustomButton>
          <span>
            <Text locale={{ textId: 'GMY.000045' }} />
          </span>
          <CustomButton
            className={titleStyle.btnInfo}
            onClick={() => {
              setIsShowToolTip(true);
            }}
          >
            <Icon name="Info"></Icon>
          </CustomButton>
          {isShowToolTip ? (
            <ToolTip
              shape='lt'
              showClose={true}
              className={titleStyle.toolTip}
              handleClose={() => {
                setIsShowToolTip(false);
              }}
            >
              <Text locale={{ textId: 'GMY.000158' }} />
            </ToolTip>
          ) : null}
        </div>
        <div className={titleStyle.rightSide}>
          {/* {isOwnRoom ? (
            <CustomButton
              className={titleStyle.btnEdit}
              onClick={handleClickSetAllRead}
            >
              전체 읽기
            </CustomButton>
          ) : null} */}
          {isOwnRoom ? (
            <CustomButton
              className={titleStyle.btnEdit}
              onClick={() => {
                handleSetUIMode(eBalloonListUIMode.Edit);
              }}
            >
              <Icon name="Edit_M" />
            </CustomButton>
          ) : null}

          <CustomButton
            className={titleStyle.btnFilter}
            onClick={() => {
              setIsOptionUIOpen(true);
            }}
          >
            <Icon name="Filter_M"></Icon>
          </CustomButton>
        </div>
      </div>
    );
  }, [
    isShowToolTip,
    handleClickSetAllRead,
    handleSetUIMode,
    setIsOptionUIOpen,
    setIsShowToolTip,
  ]);
  Header[eBalloonListUIMode.Edit] = useCallback(() => {
    return (
      <div className={titleStyle.title}>
        <div className={titleStyle.leftSide}>
          <CustomButton
            className={titleStyle.btnBack}
            onClick={() => {
              handleSetUIMode(eBalloonListUIMode.View);
            }}
          >
            <Icon name="Top_Arrow_left_M" />
          </CustomButton>
          <span>
            <Text locale={{ textId: 'GCM.000020' }} />
            (
            <Text
              locale={{
                textId: listType == 'active' ? 'GMY.000152' : 'GMY.000153',
              }}
            />
            )
          </span>
        </div>
        <div className={titleStyle.rightSide}>
          {selectedBalloonMessageNum <= 0 ? (
            <CustomButton
              onClick={handleClickSelectAllMessage}
              className={titleStyle.btnSelectAll}
            >
              <Text locale={{ textId: 'GCM.000031' }} />
            </CustomButton>
          ) : (
            <CustomButton
              onClick={handleClickUnSelectAllMessage}
              className={titleStyle.btnSelectAll}
            >
              <span
                className={titleStyle.selectedNum}
              >{`(${selectedBalloonMessageNum})`}</span>
              <Text locale={{ textId: 'GCM.000040' }} />
            </CustomButton>
          )}
        </div>
      </div>
    );
  }, [listType, selectedBalloonMessageNum, handleClickSelectAllMessage]);
  const Bottom = [];
  Bottom[eBalloonListUIMode.View] = useCallback(() => {
    return (
      <Button size="full" shape="rect" onClick={handleClickBalloonWrite}>
        <Text locale={{ textId: 'GMY.000050' }} />
      </Button>
    );
  }, []);
  Bottom[eBalloonListUIMode.Edit] = useCallback(() => {
    return (
      <div className={style.bottomWrapper}>
        <CustomButton
          className={style.btnStore}
          disabled={selectedBalloonMessageNum <= 0}
          onClick={
            listType === 'active' ? handleClickInactive : handleClickActive
          }
        >
          {listType === 'active' ? (
            <Text locale={{ textId: 'GMY.000053' }} />
          ) : (
            <Text locale={{ textId: 'GMY.000160' }} />
          )}
        </CustomButton>
        <CustomButton
          className={style.btnDelete}
          disabled={selectedBalloonMessageNum <= 0}
          onClick={handleClickDelete}
        >
          <Text locale={{ textId: 'GCM.000041' }} />
        </CustomButton>
      </div>
    );
  }, [selectedBalloonMessageNum]);
  const ListType = useCallback(() => {
    return (
      <div className={style.listType}>
        <CustomButton
          className={`${style.btnListType} ${
            listType == 'active' ? style.on : style.off
          }`}
          onClick={handleListTypeButton}
          value="active"
        >
          <CircleButton
            onClick={handleListTypeButton}
            variant="none"
            shape="none"
            size="xs"
            value="active"
          >
            <Icon
              className={style.listTypeIcon}
              name="Balloon_Keep_S"
              badge={{ isActive: listType == 'active' }}
            />
          </CircleButton>
          <Text locale={{ textId: 'GMY.000152' }} />
        </CustomButton>

        <CustomButton
          className={`${style.btnListType} ${
            listType == 'inactive' ? style.on : style.off
          }`}
          onClick={handleListTypeButton}
          value="inactive"
        >
          <CircleButton
            onClick={handleListTypeButton}
            variant="none"
            shape="none"
            size="xs"
            value="inactive"
          >
            <Icon
              className={style.listTypeIcon}
              name="Keep_S"
              badge={{ isActive: listType == 'inactive' }}
            />
          </CircleButton>
          <Text locale={{ textId: 'GMY.000153' }} />
        </CustomButton>
      </div>
    );
  }, [listType]);

  const BalloonListEmpty = useCallback(() => {
    return (
      <div className={style.listEmpty}>
        <Icon name="Allim_Empty3_Balloon" />
        <span className={style.desc}>
          {totalMessageNum <= 0 ? (
            <Text locale={{ textId: 'GMY.000156' }} />
          ) : (
            <Text text={`${t('GMY.000155')}<br/>${t('GCM.000039')}`} hasTag />
          )}
        </span>
      </div>
    );
  }, []);

  const testReadMarkIndex = 7;
  const BalloonList = useCallback(() => {
    if (filteredMessageNum <= 0) return <BalloonListEmpty />;

    return (
      <div className={style.listBody}>
        {balloonMessageList?.map((balloonData, index) =>
          balloonData ? (
            <BalloonMessageCell
              key={balloonData._id}
              data={balloonData}
              showReadMark={index === testReadMarkIndex}
              handleClick={handleClickMessageCell}
            />
          ) : null,
        )}
        <div className={style.listEndObserver} ref={inViewRef}></div>
      </div>
    );
  }, [filteredMessageNum, balloonMessageList, handleClickMessageCell]);

  return (
    <Modal isOpen={true}>
      <div className={style.background}>
        {Header[balloonListUIMode]()}
        {balloonListUIMode === eBalloonListUIMode.View ? <ListType /> : null}
        <div
          className={`${style.listArea} ${
            balloonListUIMode === eBalloonListUIMode.View
              ? style.view
              : style.edit
          }`}
        >
          <BalloonList />
        </div>
        {Bottom[balloonListUIMode]()}
      </div>
      <BalloonMessageListOpitonUI
        isOpen={isOptionUIOpen}
        setIsOpen={setIsOptionUIOpen}
      />
    </Modal>
  );
};
export default BalloonMessageListFullScreenModal;
