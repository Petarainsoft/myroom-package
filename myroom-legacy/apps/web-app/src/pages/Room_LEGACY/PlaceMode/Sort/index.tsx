import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  currentCtgrAtom,
  currentCtgrKeyAtom,
  editModeAtom,
  myCurrentCtgrAtom,
  selectedHeaderAtom,
  currentSortTypeAtom,
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import { TSort } from '@/common/stores/type';
// import CircleButton from '@/components/Buttons/Button';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import style from './style.module.scss';

type TSortProps = {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
};

const Sort = ({ className }: TSortProps): React.ReactElement => {
  const currentCtgr = useAtomValue(currentCtgrAtom);
  const [currentCtgrKey, setCurrentCtgrKey] = useAtom(currentCtgrKeyAtom);
  const [sortType, setSortType] = useAtom(currentSortTypeAtom);
  const myCurrentCtgr = useAtomValue(myCurrentCtgrAtom);
  const editMode = useAtomValue(editModeAtom);
  const selectedHeader = useAtomValue(selectedHeaderAtom);

  const handleSort = (type: TSort) => () => {
    logger.log('handleSort ', type);
    setSortType(type);
  };

  const handleMarketCategory = (ctgrKey: string) => () => {
    setCurrentCtgrKey(ctgrKey);
  };

  const MyItemList = (): React.ReactElement[] => {
    return Object.entries(currentCtgr).map((ctgr, idx) => {
      const ctgrKey = ctgr[0];
      const ctgrInfo = ctgr[1];
      const imgPath = ctgrInfo.InActiveIcon;
      const isSelected = currentCtgrKey === ctgrKey;

      return (
        <Button
          onClick={handleMarketCategory(ctgrKey)}
          className={`${style.marketCategoryBtn} ${
            isSelected ? style.selected : ''
          }`}
          key={idx}
        >
          <Icon name={imgPath} />
        </Button>
      );
    });
  };

  const MarketSort = (): React.ReactElement => {
    return (
      <div className={style.marketSort}>
        <Button
          onClick={handleSort('all')}
          className={style.myMarketBtn}
          size='s'
          variant={sortType === 'all' ? 'primary' : 'none'}
        >
          <Text locale={{ textId: 'GCM.000008' }} />
        </Button>
        <Button
          onClick={handleSort('f')}
          className={style.myMarketBtn}
          size='s'
          variant={sortType === 'f' ? 'primary' : 'none'}
        >
          <Text locale={{ textId: 'GMY.000068' }} />
        </Button>
      </div>
    );
  };

  return selectedHeader === 'FIGURE' ? (
    <></>
  ) : (
    <div className={className}>
      <div className={style.categoryArea}>
        {editMode === 'MARKET' ? (
          <MarketSort />
        ) : !(
            myCurrentCtgr === 'COORDI-MY' || myCurrentCtgr === 'COORDI-RCM'
          ) ? (
          <MyItemList />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default Sort;
