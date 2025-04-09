import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import SettingCell from './SettingCell';
import { useCallback, useState } from 'react';
import { UserSetting } from '@/common/hooks/use-profile-setting';
export type SettingData = {
  groupId: string;
  id: string;
  title: string;
  type: 'toggle' | 'checkbox';
  desc?: string;
  parentId?: string; // 부모 옵션이 있는 toggle 버튼에서만 사용한다.
  value?: string; // 같은 id 내에서 value 로 선택된 값을 판단하는 경우.
};

interface ISettingListFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  titleId: string;
  settingDataList: SettingData[];
  initUserSettingList: UserSetting[];
  handleOnClose: (data: UserSetting[]) => void;
}

const SettingListFullScreenModal = ({
  titleId,
  settingDataList,
  initUserSettingList,
  handleOnClose,
  onRequestClose,
}: ISettingListFullScreenModal) => {
  const [userSettingList, setUserSettingList] =
    useState<UserSetting[]>(initUserSettingList);
  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton
          size="xs"
          shape="none"
          onClick={() => {
            handleOnClose(userSettingList);
            onRequestClose();
          }}
        >
          <Icon name="Top_Arrow_left_M" />
        </CircleButton>
        <div className={style.headerText}>
          <Text locale={{ textId: titleId }} />
        </div>
      </div>
    );
  };
  const handleOnChangeCellData = useCallback(
    (data: SettingData) => {
      const newModifySettings = [...userSettingList];
      if (data.type === 'checkbox') {
        // groupId 가 있는 경우 해당 group 인 녀석들 중 선택된 녀석만 on, 나머지는 off.
        if (data.groupId && data.groupId !== '') {
          const groupCells = settingDataList.filter(
            (_) => _.groupId === data.groupId,
          );

          for (let i = 0; i < groupCells.length; ++i) {
            const findCell = settingDataList.find(
              (_) => _.id === groupCells[i].id,
            );
            if (findCell) {
              const findIndex = newModifySettings.findIndex(
                (_) => _.id === findCell.id,
              );
              if (findIndex != -1) {
                if (typeof newModifySettings[findIndex].value === 'boolean')
                  newModifySettings[findIndex].value = findCell.id === data.id;
                else {
                  newModifySettings[findIndex].value = data.value ?? '';
                  break;
                }
              }
            }
          }
        } else {
          const findIndex = newModifySettings.findIndex(
            (_) => _.id === data.id,
          );
          if (findIndex != -1) {
            if (typeof newModifySettings[findIndex].value === 'boolean')
              newModifySettings[findIndex].value = true;
            else newModifySettings[findIndex].value = data.value ?? '';
          }
        }
      } else if (data.type === 'toggle') {
        const findIndex = newModifySettings.findIndex((_) => _.id === data.id);
        if (findIndex !== -1) {
          newModifySettings[findIndex].value =
            !newModifySettings[findIndex].value;
        }
      }
      setUserSettingList(newModifySettings);
    },
    [settingDataList, userSettingList, setUserSettingList],
  );

  const printSettingCells = useCallback(() => {
    if (!settingDataList) return null;
    const cells: React.ReactElement[] = [];
    console.log('printSettingCells - settingDataList : ', settingDataList);
    console.log('printSettingCells - modifySettings : ', userSettingList);

    for (let i = 0; i < settingDataList.length; ++i) {
      if (settingDataList[i].parentId && settingDataList[i].parentId) {
        const parentSetting = userSettingList.find(
          (_) => _.id === settingDataList[i].parentId,
        );
        if (parentSetting && !parentSetting.value) {
          continue;
        }
      }
      const setting = userSettingList.find(
        (_) => _.id === settingDataList[i].id,
      );
      let isOn = false;
      if (setting) {
        console.log(
          'setting value type : ',
          typeof setting.value,
          ' ??? ',
          setting,
        );
        if (typeof setting.value === 'boolean') {
          isOn = setting.value;
        } else {
          isOn = setting.value === settingDataList[i].value;
        }
      }

      cells.push(
        <SettingCell
          key={i}
          data={settingDataList[i]}
          isOn={isOn}
          handleOnChange={handleOnChangeCellData}
        />,
      );
    }
    return cells;
  }, [settingDataList, userSettingList]);
  return (
    <Modal isOpen={true}>
      <div className={style.settingListModal}>
        <Header />
        <div className={style.body}>{printSettingCells()}</div>
      </div>
    </Modal>
  );
};

export default SettingListFullScreenModal;
