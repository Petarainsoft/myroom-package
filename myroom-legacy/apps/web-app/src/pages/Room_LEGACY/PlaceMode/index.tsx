import React, { useCallback } from 'react';
import usePlaceMode from './usePlaceMode';
import Action from './Action';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import SaveButton from '@/pages/_shared/ui/Buttons/SavePurchaseButton';
import GalleryOffCanvas from '@/pages/_shared/offcanvas/GalleryOffCanvas';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import MarketItemCard from '@/pages/_shared/ui/Cards/MarketItemCard';
import Coordi from '@/pages/Room_LEGACY/PlaceMode/Coordi';

import usePlaceModeNew from './hooks';


const PlaceMode = () => {
  // const {
  //   isMarket,
  //   handleClickMarketItem,
  // } = usePlaceModeNew();

  const profileId = '';
  const avatarId = '';
  const itemId = '';

  const {
    isMarket,
    currentCategory,
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
    handleClickOpenResetSheet,
    handleClickCloseResetSheet,
    handleClickMarketItem,
    handleRoomSave,
  } = usePlaceModeNew({ profileId, avatarId, itemId });

  const ItemComponent = useCallback(
    (props: any) => {
      const { data } = props;

      if (data) {
        if (isMarket) {
          return (
            <MarketItemCard
              id={data._id}
              onClick={() => handleClickMarketItem(data._id)}
              selected={false}
            />
          );
          // return <Item id={data._id} forceEquip={itemId === data._id} />
        } else {
          switch (currentCategory) {
            case 'COORDI':
              return <Coordi  data={data} />;
              return <></>;
            case 'OWN':
              return (
                <MarketItemCard
                  id={data._id}
                  onClick={() => handleClickMarketItem(data._id)}
                  selected={true}
                />
              );
            case 'LIKE':
              return (
                <MarketItemCard
                  id={data._id}
                  onClick={() => handleClickMarketItem(data._id)}
                  selected={true}
                />
              );
          }
        }
      }
      return <></>;
    },
    [currentCategory, handleClickMarketItem, isMarket],
  );

  //------------------------------------

  //------------------------------------

  usePlaceMode();


  React.useEffect(() => {
    import('@Modal/CartFullScreenModal');

    setTimeout(() => {

    }, 100);
  }, []);

  React.useEffect(() => {
    // 뒤로가기 방지
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.go(1);
    };

    // 새로고침 방지
    window.onbeforeunload = function () {
      return '';
    };

    return () => {
      window.onbeforeunload = null;
      window.onpopstate = null;
    };
  }, []);

  return (
    <React.Fragment>
      <div className={style['saveBtn']}>
        <SaveButton onSave={handleRoomSave} />
      </div>
      <GalleryOffCanvas
        isMarket={isMarket}
        onToggle={handleToggle}
        category={category}
        subCategory={subCategory}
        onClickCategory={handleClickCategory}
        onClickSubCategory={handleClickSubCategory}
        actionArea={{
          center: <Action />,
          end: (
            <CircleButton size={'m'} onClick={handleClickOpenResetSheet}>
              <Icon name="Reset_M" />
            </CircleButton>
          ),
        }}
        saveBtnId="ga-room-custom-save"
        contents={{
          shape: currentCategory === 'COORDI' ? 'rect' : 'square',
          itemCount: itemCount,
          isItemLoaded: (index) => list.length > index,
          loadMoreItems: fetchNextPage,
          element: (index) => <ItemComponent data={list[index]} />,
          elementId: (index) => list[index]?._id,
        }}
      />
      <SelectOffCanvas
        isOpen={isOpenResetSheet}
        onClose={handleClickCloseResetSheet}
        buttonList={selectSheetList}
      />
    </React.Fragment>
  );
};

export default PlaceMode;
