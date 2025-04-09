import { useAtom } from 'jotai';
import toNumber from 'lodash/toNumber';
import {
  balloonListFilterFlagAtom,
  balloonListOrderByDescAtom,
} from '@/common/stores';
import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import CheckBox from '@/components/Forms/CheckBox';
import { ChangeEvent, useState } from 'react';
import Text from '@/components/Text';

interface IBalloonListOptionUI {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export enum Filter {
  Me = 1,
  NotRead = 1 << 1,
}
const BalloonMessageListOpitonUI = ({
  isOpen,
  setIsOpen,
}: IBalloonListOptionUI) => {
  const [balloonListFilterFlag, setBalloonListFilterFlag] = useAtom(
    balloonListFilterFlagAtom,
  );
  const [balloonListOrderByDesc, setBalloonListOrderByDesc] = useAtom(
    balloonListOrderByDescAtom,
  );

  const [filterFlag, setFilterFlag] = useState(balloonListFilterFlag);
  const [orderByDesc, setOrderByDesc] = useState(balloonListOrderByDesc);
  const onClickApply = () => {
    setBalloonListFilterFlag(filterFlag);
    setBalloonListOrderByDesc(orderByDesc);
    setIsOpen(false);
  };
  const handleJustClose = () => {
    setFilterFlag(balloonListFilterFlag);
    setOrderByDesc(balloonListOrderByDesc);
    setIsOpen(false);
  };
  const onChangeFilterCheckBox = (e: ChangeEvent<HTMLInputElement>) => {
    const flag = toNumber(e.currentTarget.value);
    if (e.currentTarget.checked) {
      setFilterFlag((prevFlag) => prevFlag | flag);
    } else {
      setFilterFlag((prevFlag) => prevFlag & ~flag);
    }
  };

  return isOpen ? (
    <OffCanvas
      isOpen={isOpen}
      onClose={handleJustClose}
      initialSnap={0}
      disableDrag={false}
      headerOptions={{
        disableClose: true,
        disableBottomLine:true,
      }}
      // backdropProps={{onTap:handleClose}}
    >
      <div className={style.body}>
        <div className={style.sectionTitle}>
          <Text locale={{ textId: 'GCM.000038' }} defaultValue="필터" />
        </div>
        <div className={style.sectionBody}>
          <label className={style.checkboxWrapper}>
            <CheckBox
              className={style.checkBox}
              onChange={onChangeFilterCheckBox}
              value={Filter.Me}
              checked={(filterFlag & Filter.Me) == Filter.Me}
            />
            <Text
              locale={{ textId: 'GCM.000030' }}
              defaultValue="내 풍선만 보기"
            />
          </label>
          <label className={style.checkboxWrapper}>
            <CheckBox
              className={style.checkBox}
              onChange={onChangeFilterCheckBox}
              value={Filter.NotRead}
              checked={(filterFlag & Filter.NotRead) == Filter.NotRead}
            />
            <Text
              locale={{ textId: '읽지 않은 풍선만 보기' }}
              defaultValue="읽지 않은 풍선만 보기"
            />
          </label>
        </div>

        <div className={style.sectionTitle}>
          <Text locale={{ textId: 'GCM.000027' }} defaultValue="정렬" />
        </div>
        <div className={style.sectionBody}>
          <CustomButton
            className={`${style.btnOrder} ${
              orderByDesc ? style.on : style.off
            }`}
            onClick={() => {
              setOrderByDesc(true);
            }}
          >
            <Text locale={{ textId: 'GCM.000028' }} defaultValue="최신순" />
          </CustomButton>
          <CustomButton
            className={`${style.btnOrder} ${
              orderByDesc ? style.off : style.on
            }`}
            onClick={() => {
              setOrderByDesc(false);
            }}
          >
            <Text locale={{ textId: 'GCM.000029' }} defaultValue="오래된 순" />
          </CustomButton>
        </div>

        <div className={style.bottomButtons}>
          <CustomButton className={style.btnClose} onClick={handleJustClose}>
            <Text locale={{ textId: 'GCM.000033' }} defaultValue="닫기" />
          </CustomButton>
          <CustomButton className={style.btnApply} onClick={onClickApply}>
            <Text locale={{ textId: 'GMY.000094' }} defaultValue="적용" />
          </CustomButton>
        </div>
      </div>
    </OffCanvas>
  ) : (
    <></>
  );
};
export default BalloonMessageListOpitonUI;
