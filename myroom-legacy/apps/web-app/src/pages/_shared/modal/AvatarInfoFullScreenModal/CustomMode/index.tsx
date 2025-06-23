
import React, { useCallback } from 'react';
import GalleryOffCanvas from '@/pages/_shared/offcanvas/GalleryOffCanvas';
import useCustomMode from './hooks';
import Coordi from './Coordi';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import MarketItemCard from '@/pages/_shared/ui/Cards/MarketItemCard';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';

type CustomModeProps = {
  profileId: string;
  avatarId: string;
  itemId?: string;
};

const CustomMode = ({ profileId, avatarId, itemId }: CustomModeProps) => {
  const {
    isMarket,
    currentCategory,
    currentSubCategory,
    list,
    category,
    subCategory,
    itemCount,
    selectSheetList,
    isOpenResetSheet,
    fetchNextPage,
    handleToggle,
    handleClickCategory,
    handleClickSubCategory,
    handleClicOpenResetSheet,
    handleClicCloseResetSheet,
    handleClickMarketItem,
    checkEquipItem,
  } = useCustomMode({ profileId, avatarId, itemId });

  const ItemComponent = useCallback(
    (props: any) => {
      const { data } = props;

      if (data) {
        if (isMarket) {
          return (
            <MarketItemCard
              id={data._id}
              onClick={() => handleClickMarketItem(data._id)}
              selected={checkEquipItem(data._id)}
            />
          );
          // return <Item id={data._id} forceEquip={itemId === data._id} />
        } else {
          switch (currentCategory) {
            case 'COORDI':
              return <Coordi data={data} />;
            case 'OWN':
              return (
                <MarketItemCard
                  id={data.item_id}
                  onClick={() => handleClickMarketItem(data.item_id)}
                  selected={checkEquipItem(data.item_id)}
                />
              );
            case 'LIKE':
              return (
                <MarketItemCard
                  id={data?._id?.target_id}
                  onClick={() => handleClickMarketItem(data?._id?.target_id)}
                  selected={checkEquipItem(data?._id?.target_id)}
                />
              );
          }
        }
      }
      return <></>;
    },
    [checkEquipItem, currentCategory, handleClickMarketItem, isMarket],
  );

  return (
    <React.Fragment>
      <GalleryOffCanvas
        isMarket={isMarket}
        onToggle={handleToggle}
        category={category}
        subCategory={subCategory}
        onClickCategory={handleClickCategory}
        onClickSubCategory={handleClickSubCategory}
        actionArea={{
          end: <CircleButton size={"l"} onClick={handleClicOpenResetSheet}>
            <Icon name="Reset_M" />
          </CircleButton>
        }}
        saveBtnId="ga-avatar-custom-save"
        contents={{
          shape: currentCategory === 'COORDI' ? 'rect' : 'square',
          itemCount: itemCount,
          isItemLoaded: (index) => list.length > index,
          loadMoreItems: fetchNextPage,
          element: (index) => <ItemComponent data={list[index]} />,
          elementId: (index) => list[index]?._id,
        }}
        currentCategory={currentCategory}
        currentSubCategory={currentSubCategory}
      />
      <SelectOffCanvas
        isOpen={isOpenResetSheet}
        onClose={handleClicCloseResetSheet}
        buttonList={selectSheetList}
      />
    </React.Fragment>
  );
};

export default CustomMode;
