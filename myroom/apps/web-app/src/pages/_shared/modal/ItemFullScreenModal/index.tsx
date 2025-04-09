import { useMemo, useCallback } from 'react';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import style from './styles.module.scss';
import Switcher, { SwitchCompnents } from '../../layouts/Switcher';
import useItemFullScreenModal from './hooks';
import CanvasScene from '../../ui/CanvasScene';
import View from '../../layouts/View';
import SettingMode from './SettingMode';
import ViewMode from './ViewMode';
import MemoMessageBox from './MemoMessageBox';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
export type ModeType = 'VIEW' | 'SETTING';
interface IItemFullScreenModal extends Omit<ModalProps, 'onRequestClose'> {
  itemId: string;
  itemInstanceId: string;
  mode: ModeType;
}

const ItemFullScreenModal = ({
  itemId,
  mode,
  itemInstanceId,
}: IItemFullScreenModal) => {
  // 추후에는 myRoomBgColor를 atom에서 css variable로 변경해야함.
  // const myRoomBgColor = useAtomValue(myRoomBgColorAtom);

  const {
    sceneStatus,
    itemFunctionType,
    handleClickSave,
    handleCloseModal,
    handleClickReset,
    onAfterInitScene,
  } = useItemFullScreenModal(itemId, itemInstanceId);

  /**
   * 모드 설정
   */
  const modes = useMemo((): SwitchCompnents<ModeType> => {
    return [
      {
        status: 'SETTING',
      element:    <SettingMode itemFunctionType={itemFunctionType} />,
      },
      {
        status: 'VIEW',
        element:  <ViewMode itemId={itemId} itemInstanceId={itemInstanceId} />
      },
    ];
  }, [itemFunctionType, itemId, itemInstanceId]);

  /**
   * 헤더 우측 저장 버튼
   */

  const ActionButtons = useCallback(() => {
    if (mode === 'SETTING') {
      return <>
        <CircleButton size={'l'} onClick={handleClickReset} className={style['reset']}>
          <Icon name={"Reset_M"} />
        </CircleButton>
        <Button variant="tertiary" size="m" onClick={handleClickSave}>
          <Text locale={{ textId: 'GCM.000015' }} />
          </Button>
      </>
     
    }
    else {
      return null;
    }
    
  }, [handleClickSave, handleClickReset, mode]);

  return (
    <Modal isOpen={true} className={style.wrap}>
      <View
        headerOptions={{
          float: true,
          closeOptions: {
            onClick: handleCloseModal,
            icon: 'x',
          },
          endArea: <ActionButtons />,
        }}
        fixed
        disableNavigation
        className={style.itemModalBackground}
      >
        <CanvasScene type='ITEM' onAfterSceneReady={onAfterInitScene} />
        <MemoMessageBox
          itemInstanceId={itemInstanceId}
          className={style['message-box']}
          mode={mode}
        />
        {sceneStatus && <Switcher status={mode} elements={modes} />}
      </View>
    </Modal>
  );
};

export default ItemFullScreenModal;
