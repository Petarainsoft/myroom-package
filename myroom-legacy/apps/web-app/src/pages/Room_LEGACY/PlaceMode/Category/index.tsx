import React, { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  currentCtgrAtom,
  currentCtgrKeyAtom,
  editModeAtom,
  myCurrentCtgrAtom,
  selectedHeaderAtom,
  uiPlaceModeSheetSizeAtom,
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import Button from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import { TMyCategory } from '@/common/stores/type';
import style from './style.module.scss';

import MarketToggleButton from '../../components/MarketToggleButton';

const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30,
};

type CategoryProps = {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
};

const Category = ({ className }: CategoryProps): React.ReactElement => {
  const currentCtgr = useAtomValue(currentCtgrAtom);
  const [currentCtgrKey, setCurrentCtgrKey] = useAtom(currentCtgrKeyAtom);
  const [editMode, setEditMode] = useAtom(editModeAtom);
  const [placeModeSheetSize, setPlaceModeSheetSize] = useAtom(
    uiPlaceModeSheetSizeAtom,
  );
  const [myCurrentCtgr, setMyCurrentCtgr] = useAtom(myCurrentCtgrAtom);
  const selectedHeader = useAtomValue(selectedHeaderAtom);

  /** My/Market 전환 */
  const handleEditMode = useCallback(() => {
    logger.log('HandleEditMode to ', editMode === 'MY' ? 'MARKET' : 'MY');
    editMode === 'MY' ? setEditMode('MARKET') : setEditMode('MY');
    if (placeModeSheetSize) setPlaceModeSheetSize(!placeModeSheetSize);
  }, [editMode, setEditMode]);

  const handleResize = () => {
    logger.log('handleResize');
    setPlaceModeSheetSize(!placeModeSheetSize);
  };

  const handleMarketCategory = (ctgrKey: string) => () => {
    logger.log('handleMarketCategory', Number(ctgrKey));
    if (placeModeSheetSize) setPlaceModeSheetSize(!placeModeSheetSize);

    if (!ctgrKey.includes(',')) setCurrentCtgrKey(ctgrKey);
    else {
      const superKey = ctgrKey.substring(0, 1);
      const mainKey = ctgrKey.substring(0, 2);
      setCurrentCtgrKey(`${superKey},${mainKey},${ctgrKey}`);
    }
  };

  const handleMyCategory = (myCtgr: TMyCategory) => () => {
    logger.log('handleMyCategory', myCtgr);
    setMyCurrentCtgr(myCtgr);

    if (placeModeSheetSize) setPlaceModeSheetSize(!placeModeSheetSize);
  };

  const MyCategoryList = (): React.ReactElement => {
    return (
      <>
        <div
          onClick={handleMyCategory('COORDI-MY')}
          className={`${style.myCategoryBtn} 
            ${'COORDI-MY' === myCurrentCtgr ? style.selected : ''}`}
        >
          <Text locale={{ textId: 'GMY.000069' }} />
        </div>
        <div
          onClick={handleMyCategory('COORDI-RCM')}
          className={`${style.myCategoryBtn} 
            ${'COORDI-RCM' === myCurrentCtgr ? style.selected : ''}`}
        >
          <Text locale={{ textId: 'GMY.000070' }} />
        </div>
        {selectedHeader === 'SKIN' ? (
          <div
            onClick={handleMyCategory('SKIN-MY')}
            className={`${style.myCategoryBtn} ${
              'SKIN-MY' === myCurrentCtgr ? style.selected : ''
            }`}
          >
            <Text locale={{ textId: 'GMY.000071' }} />
          </div>
        ) : (
          <div
            onClick={handleMyCategory('ITEM-MY')}
            className={`${style.myCategoryBtn} 
              ${'ITEM-MY' === myCurrentCtgr ? style.selected : ''}`}
          >
            <Text locale={{ textId: 'GMY.000073' }} />
          </div>
        )}
        {selectedHeader === 'SKIN' ? (
          <div
            onClick={handleMyCategory('SKIN-FAV')}
            className={`${style.myCategoryBtn} 
              ${'SKIN-FAV' === myCurrentCtgr ? style.selected : ''}`}
          >
            <Text locale={{ textId: 'GMY.000072' }} />
          </div>
        ) : (
          <div
            onClick={handleMyCategory('ITEM-FAV')}
            className={`${style.myCategoryBtn} 
              ${'ITEM-FAV' === myCurrentCtgr ? style.selected : ''}`}
          >
            <Text locale={{ textId: 'GMY.000074' }} />
          </div>
        )}
      </>
    );
  };

  const MarketCategoryList = (): React.ReactElement[] => {
    const data = Object.entries(currentCtgr).map((ctgr, idx) => {
      const ctgrKey = ctgr[0];
      const ctgrInfo = ctgr[1];
      const imgPath = ctgrInfo.InActiveIcon;

      let isSelected = false;
      if (!ctgrKey.includes(',')) isSelected = currentCtgrKey === ctgrKey;
      else {
        const superKey = ctgrKey.substring(0, 1);
        const mainKey = ctgrKey.substring(0, 2);
        isSelected = currentCtgrKey === `${superKey},${mainKey},${ctgrKey}`;
      }

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
    return data;
  };

  // const FigureCate = (): React.ReactElement => {
  //   return (
  //     <Bottom.Category>
  //       <Bottom.CategoryItem
  //         onClick={handleMyCategory('COORDI-MY')}
  //         className={`${style.figureCateItem}`}
  //         isActive={'COORDI-MY' === myCurrentCtgr}
  //       >
  //         <Text text="내 피규어" />
  //       </Bottom.CategoryItem>
  //     </Bottom.Category>
  //   );
  // };

  // const Skin_ItemCate = (): React.ReactElement => {
  //   return (
  //     // <Bottom.Category>
  //     //   <MarketToggleButton
  //     //     onClickToggle={handleEditMode}
  //     //     editMode={editMode as 'MY' | 'MARKET'}
  //     //   />
  //     //   <div className={style.categoryArea}>
  //     //     {editMode === 'MY' ? <MyCategoryList /> : <MarketCategoryList />}
  //     //   </div>
  //     // </Bottom.Category>
  //   );
  // };

  return (
    <div className={className}>
      <div className={style.fold}>
        <Button onClick={handleResize}>
          <Icon name={placeModeSheetSize ? 'Open' : 'Close'} />
        </Button>
      </div>
      {/* {selectedHeader === 'FIGURE' ? <FigureCate /> : <Skin_ItemCate />} */}
    </div>
  );
};

export default Category;
