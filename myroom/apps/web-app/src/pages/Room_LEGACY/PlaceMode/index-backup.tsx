import React from 'react';

import usePlaceMode from './usePlaceMode';



// import usePlaceModeNew from './hooks';

const PlaceMode = () => {
  // const {
  //   isMarket,
  //   handleClickMarketItem,
  //   checkEquipItem
  // } = usePlaceModeNew();


  // const {
  //   isMarket,
  //   currentCategory,
  //   list,
  //   category,
  //   subCategory,
  //   itemCount,
  //   selectSheetList,
  //   isOpenResetSheet,
  //   fetchNextPage,
  //   handleToggle,
  //   handleClickCategory,
  //   handleClickSubCategory,
  //   handleClickOpenResetSheet,
  //   handleClickCloseResetSheet,
  //   handleClickMarketItem,
  //   checkEquipItem,
  // } = usePlaceModeNew({ profileId, avatarId, itemId });

  
  // const ItemComponent = useCallback(
  //   (props: any) => {
  //     const { data } = props;

  //     if (data) {
  //       if (isMarket) {
  //         return (
  //           <MarketItemCard
  //             id={data._id}
  //             onClick={() => handleClickMarketItem(data._id)}
  //             selected={false}
  //             // selected={checkEquipItem(data._id)}
  //           />
  //         );
  //         // return <Item id={data._id} forceEquip={itemId === data._id} />
  //       } else {
  //         switch (currentCategory) {
  //           case 'COORDI':
  //             // return <Coordi data={data} />;
  //             return <></>;
  //           case 'OWN':
  //             return (
  //               <MarketItemCard
  //                 id={data._id}
  //                 onClick={() => handleClickMarketItem(data._id)}
  //                 selected={true}
  //               />
  //             );
  //           case 'LIKE':
  //             return (
  //               <MarketItemCard
  //                 id={data._id}
  //                 onClick={() => handleClickMarketItem(data._id)}
  //                 selected={true}
  //               />
  //             );
  //         }
  //       }
  //     }
  //     return <></>;
  //   },
  //   [checkEquipItem, currentCategory, handleClickMarketItem, isMarket],
  // );

  //------------------------------------


  usePlaceMode();
  // const [delay, setDelay] = React.useState(false);
  // const sizeMode = useAtomValue(uiPlaceModeSheetSizeAtom);

  React.useEffect(() => {
    setTimeout(() => {

    }, 100);
  }, []);

  React.useEffect(() => {
    // 뒤로가기 방지
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.go(1);
    }

    // 새로고침 방지
    window.onbeforeunload = function () {
      return '';
    }


    return () => {
      window.onbeforeunload = null;
      window.onpopstate = null;
    }
  }, []);


  return (
    <React.Fragment>
      {/* <GalleryOffCanvas
        isMarket={isMarket}
        onToggle={handleToggle}
        category={category}
        subCategory={subCategory}
        onClickCategory={handleClickCategory}
        onClickSubCategory={handleClickSubCategory}
        actionArea={{
          center: <Action/>,
          end: <CircleButton size={"m"} onClick={handleClickOpenResetSheet}>
            <Icon name="Reset_M" />
          </CircleButton>
        }}
        saveBtnId="ga-avatar-custom-save"
        // contents={{
        //   shape: currentCategory === 'COORDI' ? 'rect' : 'square',
        //   itemCount: itemCount,
        //   isItemLoaded: (index) => list.length > index,
        //   loadMoreItems: fetchNextPage,
        //   element: (index) => <ItemComponent data={list[index]} />,
        // }}
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
      /> */}
      {/* <SaveButton /> */}
      {/* <DynamicSheet isOpen={delay} direction="RESIZE_BOT" sizeMode={sizeMode}>
        <Cate className={style.contentCategory} />
        <div className={style.container_Sort_Item} >
          <Sort className={style.contentSort} />
          <Item className={style.contentItem} />
        </div>
        <Action/>
      </DynamicSheet> */}
    </React.Fragment>
  );
};

export default PlaceMode;
