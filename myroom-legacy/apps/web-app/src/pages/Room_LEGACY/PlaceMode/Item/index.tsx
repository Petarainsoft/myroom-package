import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currentCtgrKeyAtom,
  currentSortTypeAtom,
  editModeAtom,
  isInitializedRoomSceneAtom,
  myCurrentCtgrAtom,
  purchaseItemListAtom,
  refreshOwnedItemFlagAtom,
  roomObjectAtom,
  selectedHeaderAtom,
  selectedItemAtom,
  selectedScreenItemIdAtom,
  uiSavePurchaseModeAtom,
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import useMarketAPI from '@/apis/Meta/Market';
import useSearchAPI from '@/apis/Search';
import useFollowAPI from '@/apis/User/Follow';
import useReactionAPI from '@/apis/Social/Reaction';
import useProfileAPI from '@/apis/User/Profile';
import { useLongPress } from 'use-long-press';
import Button from '@/components/Buttons/CustomButton';
import Image from '@/components/Image';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Coordi from './Coordi';
import { SceneManager } from '@/common/utils/client';
import usePopup from '@/common/hooks/Popup/usePopup';
import { t } from 'i18next';
import Container from '@/pages/_shared/layouts/Container';
import useItemAPI from '@/apis/Meta/Item';
import style from './style.module.scss';

type TListProps = {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
};

const Item = ({}: TListProps): React.ReactElement => {
  const { showToastPopup } = usePopup();
  const [isFavEmpty, setFavEmpty] = React.useState(true);
  const [selectedSkin, setSelectedSkin] = React.useState('');
  const [selectedItem, setSelectedItem] = useAtom(selectedItemAtom);
  const setSelectedScreenItemIdItem = useSetAtom(selectedScreenItemIdAtom);
  const myCurrentCtgr = useAtomValue(myCurrentCtgrAtom);
  const editMode = useAtomValue(editModeAtom);
  const setUiSavePurchaseMode = useSetAtom(uiSavePurchaseModeAtom);
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);
  const refreshOwnedItemFlag = useAtomValue(refreshOwnedItemFlagAtom);
  const isInitializedRoomScene = useAtomValue(isInitializedRoomSceneAtom);
  const currentCtgrKey = useAtomValue(currentCtgrKeyAtom);
  const selectedHeader = useAtomValue(selectedHeaderAtom);
  const sortType = useAtomValue(currentSortTypeAtom);
  const [roomObjects, setRoomObjects] = useAtom(roomObjectAtom);

  const { fetchMyReaction, mutationPostReaction } = useReactionAPI(); // 좋아요
  const { fetchMeItems } = useItemAPI(); // 보유 중 아이템
  const { fetchProduct } = useMarketAPI(); // 아이템 단건
  const { fetchSearchProducts } = useSearchAPI(); // 아이템 아이디 리스트
  const {
    data: userOwnedItemData,
    refetch: userOwnedItemDataRefetch,
    isSuccess,
  } = fetchMeItems(
    { category: currentCtgrKey, limit: 1000 },
    // isInitializedRoomScene,
  );

  const marketSearchData = fetchSearchProducts(
    {
      category: currentCtgrKey,
      filter: sortType,
      limit: 1000,
    },
    isSuccess,
    // isSuccess && userOwnedItemData?.error === undefined,
  ).data?.list;

  const { fetchMeFollowings } = useFollowAPI(); // 팔로우 (피규어)
  const followListData = fetchMeFollowings({
    limit: 100,
    test: 'status-message',
  }).data?.list;
  const { fetchProfile } = useProfileAPI();

  /** 좋아요 - 롱프레스 영역 */
  const callback = (evt: any, meta: { context: any }) => {
    logger.log('userFavItemData Long pressed! ', meta.context, evt);
    mutationPostReaction.mutate({
      id: meta.context,
      params: {
        origin_profile_id: meta.context,
        reaction: 'like',
      },
    });
  };

  //@ts-ignore
  const longPress = useLongPress(callback, {
    threshold: 1500, // In milliseconds
    captureEvent: true, // Event won't get cleared after React finish processing it
    cancelOnMovement: 25, // Square side size (in pixels) inside which movement won't cancel long press
    cancelOutsideElement: true, // Cancel long press when moved mouse / pointer outside element while pressing
    detect: 'pointer', // Default option
  });

  const isInPurchaseItemList = (id: string) => {
    return (
      purchaseItemList.findIndex((productData) => productData._id === id) > -1
    );
  };

  const isOwnItem = (id: string) => {
    return (
      userOwnedItemData?.pages[0]?.list?.find(
        (ownedItem) => ownedItem.item_id === id,
      ) !== undefined
    );
  };

  const isPlaced = (id: string) => {
    return (
      roomObjects.find((placedItemId) => placedItemId === id) !== undefined
    );
  };

  const fetchData = async (url: string) => {
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      return '';
    }
  };

  const handleItem = (item: any) => () => {
    logger.log('handleItem', item);
    const id = item._id;
    if (!id) return;
    setSelectedItem(id);
    setSelectedScreenItemIdItem(id);
    if (selectedHeader === 'SKIN') {
      /**
       * thumbnail.png 와 동일 resource 디렉토리에 placeinfo.json 존재
       * 이 json 파일에 현재 manifest 데이터들을 이동시키고 이 json을 initialize
       * 또한 최초로 makeManifest된 manifest를 initialize를 해야함
       * (복층 관련 문제 때문에 로직 변경)
       */
      const resourceUrl: Array<string> = item.resource.thumbnail.split('/');
      resourceUrl.pop();
      resourceUrl.push('placeinfo.json');
      const templateManifestUrl = resourceUrl.join('/');

      fetchData(templateManifestUrl).then((templateManifest) => {
        SceneManager.Room?.changeRoomSkin(templateManifest);
      });
      setSelectedSkin(id);

      if (item.option.price.type === 1) return;
      if (isInPurchaseItemList(id)) return;
      if (isOwnItem(id)) return;
      if (isPlaced(id)) return;
      setPurchaseItemList((prev) => [...prev, item]);
    } else if (selectedHeader === 'ITEM') {
      logger.log('handleItem ITEM', id);

      SceneManager.Room?.placeNewItem({
        itemId: id,
        callback: (_id) => {
          if (_id === '')
            showToastPopup({ titleText: t('배치 공간이 부족합니다.') });
          SceneManager.Room?.getAllItemIds((ids) => setRoomObjects(ids));
        },
      });

      if (item.option.price.type === 1) return;
      if (isInPurchaseItemList(id)) return;
      if (isOwnItem(id)) return;
      if (isPlaced(id)) return;
      setPurchaseItemList((prev) => [...prev, item]);
    } else if (selectedHeader === 'FIGURE') {
      logger.log('handleItem FIGURE', id);
      SceneManager.Room?.placeNewFigure(item.avatar_id, false);
      SceneManager.Room?.deselectTarget();
    }
  };

  React.useEffect(() => {
    SceneManager.Room?.getAllItemIds((allItemIds) => {
      logger.log('getAllItemIds ', allItemIds);
      setRoomObjects(allItemIds); // 아이템 최초 불러올 시만 여기서 설정
    });
  }, [isInitializedRoomScene]);

  React.useEffect(() => {
    if (purchaseItemList.length > 0) setUiSavePurchaseMode('P');
    else setUiSavePurchaseMode('S');
  }, [purchaseItemList]);

  React.useEffect(() => {
    userOwnedItemDataRefetch();
  }, [refreshOwnedItemFlag]);

  const ItemElement = (id: { data: string }): React.ReactElement => {
    const searchId = id.data;

    const { data: itemData, isSuccess } = fetchProduct(searchId);
    const { data: favData } = fetchMyReaction(searchId);

    if (!isSuccess || !itemData?.data) {
      return (
        <li className={`${style.item_li}`} key={searchId}>
          <Button>
            <Image src={''} />
            <div className={style.item_info}>
              <Text text={''} />
            </div>
          </Button>
        </li>
      );
    } else {
      const item = itemData?.data;
      const isOwn = isOwnItem(itemData?.data._id);
      const isNotForSale = item.option.price.type === 1; // 비매품.
      const placedCount = roomObjects.filter(
        (id: string) => id === searchId,
      ).length;
      // 보유중인 아이템인데 구매목록에 들어가 있는 경우 지워주어야한다.
      if (isOwn && isInPurchaseItemList(itemData.data._id)) {
        logger.log(
          '@@@@@@@@ is owned item. remove purchaseItemList ',
          itemData,
          ' purchaseItemList : ',
          purchaseItemList,
        );
        setPurchaseItemList((prev) =>
          prev.filter((data) => {
            data._id != itemData.data._id;
          }),
        );
      }
      if (placedCount > 0 && !isOwn && !isNotForSale) {
        if (!isInPurchaseItemList(item._id)) {
          logger.log(
            'purchase compare  ',
            item.option.price.type,
            isOwn,
            placedCount,
          );
          setPurchaseItemList((prev) => [...prev, item]);
        }
      }

      let ItemInfo: React.ReactElement = <></>;
      if (isOwn || isNotForSale) {
        if (placedCount > 0) {
          ItemInfo = (
            <>
              <div className={style.item_info_icon}>
                <Icon name={'On'} />
              </div>
              <div>
                {placedCount > 1
                  ? placedCount > 99
                    ? '+99'
                    : placedCount
                  : ''}
              </div>
            </>
          );
        } else if (selectedSkin === item._id) {
          ItemInfo = (
            <>
              <div className={style.item_info_icon}>
                <Icon name={'On'} />
              </div>
            </>
          );
        } else
          ItemInfo = (
            <div className={style.isExist}>
              <Text locale={{ textId: 'GMY.000077' }} />
            </div>
          );
        // } else if (isNotForSale) {
        //   ItemInfo = (
        //     <>
        //       <div className={style.item_info_icon}>
        //         <Icon name={'On'} />
        //       </div>
        //       <div>
        //         {placedCount > 1 ? (placedCount > 99 ? '+99' : placedCount) : ''}
        //       </div>
        //     </>
        //   );
      } else if (item.option.price.type === 2) {
        ItemInfo = (
          <div>
            <Text locale={{ textId: 'GMY.000068' }} />
          </div>
        );
      } else if (item.option.price.type === 3) {
        ItemInfo = (
          <>
            <div className={style.item_info_icon}>
              <Icon name={'Money'} />
            </div>
            <div>
              <Text text={String(item.option.price.amount)} />
            </div>
          </>
        );
      } else if (item.option.price.type === 4) {
        ItemInfo = (
          <>
            <div className={style.item_info_icon}>
              <Icon name={'Money'} />
            </div>
            <div>
              <Text text={String(item.option.price.amount)} />
            </div>
          </>
        );
      } else {
        //
      }

      let isFav = false; // 좋아요 체크
      if (favData?.data && favData?.data.stat.reaction.like === 1) isFav = true;

      let Item: React.ReactElement = (
        <li
          className={`${style.item_li} ${
            selectedItem === item._id ? style.selected : ''
          }`}
          key={searchId}
        >
          <Button
            onClick={handleItem(item)}
            {...longPress(item._id)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <Image src={item.resource.thumbnail} />
            <div className={style.item_info}>{ItemInfo}</div>
            {isFav ? (
              <div className={style.favoriteIcon}>
                <Icon name={'Bookmark_S_On'} />
              </div>
            ) : (
              <></>
            )}
          </Button>
        </li>
      );

      if (editMode === 'MARKET') {
        //
      } else if (myCurrentCtgr === 'ITEM-MY') {
        if (isNotForSale || isOwn) {
          //
        } else Item = <></>;
      } else if (myCurrentCtgr === 'ITEM-FAV') {
        logger.log('MY- ITEM-FAV ');
        if (!isFav) Item = <></>;
        else setFavEmpty(false);
      } else if (myCurrentCtgr === 'SKIN-MY') {
        logger.log('MY- SKIN-MY ');
        if (isNotForSale || isOwn) {
          //
        } else Item = <></>;
      } else if (myCurrentCtgr === 'SKIN-FAV') {
        logger.log('MY- SKIN-FAV ');
        if (!isFav) Item = <></>;
      }

      return Item;
    }
  };

  const ItemList = React.useMemo(() => {
    return (
      marketSearchData &&
      marketSearchData.map((item, idx) => (
        <ItemElement data={`${item._id}`} key={idx} />
      ))
    );
  }, [
    selectedItem,
    marketSearchData,
    userOwnedItemData,
    roomObjects,
    myCurrentCtgr,
    selectedHeader,
    selectedSkin,
  ]);

  const FigureElement = (id: { data: string }): React.ReactElement => {
    const profileId = id.data;
    const { data: figureData, isSuccess } = fetchProfile(profileId);

    if (!isSuccess || !figureData?.data) {
      return (
        <li className={`${style['figure_li']}`} key={profileId}>
          <Button>
            <Image src={''} />
            <div className={style['item_info']}>
              <Text text={'없음'} />
            </div>
          </Button>
        </li>
      );
    } else {
      return (
        <li className={
          `${style['figure_li']} 
          ${selectedItem === figureData?.data._id ? style['selected'] : ''}`
          }
          key={profileId}
          onClick={handleItem(figureData?.data)}
        >
          <div
            className={style['thumbnail']}
            style={{
              backgroundImage: `url(${figureData?.data?.resource?.image_selfie})`,
            }}
          ></div>
          <div className={style.nick}>
            <Text text={figureData?.data.option.nick} />
          </div>
          <div className={style['id-box']}>@{figureData.data._id}</div>
        </li>
      );
    }
  };

  const FigureList = React.useMemo(
    () =>
      followListData &&
      followListData.map((figure, idx) => (
        <FigureElement data={`${figure._id}`} key={idx} />
      )),
    [selectedItem, followListData, selectedHeader],
  );

  const EmptyFavElement: React.ReactElement = (
    <div className={style.emptyFavElement}>
      <div className={style.favEmpty}>
        <div className={style.favIcon}>
          <Icon name={`Bookmark_S_On`} />
        </div>
        <div className={style.favText}>
          {selectedHeader === 'SKIN' ? (
            <Text text={'스킨을 길게 눌러서 찜 하거나'} />
          ) : (
            <Text text={'아이템을 길게 눌러서 찜 하거나'} />
          )}
          <br />
          <Text text={'취소할 수 있어요.'} />
        </div>
      </div>
    </div>
  );

  return selectedHeader === 'FIGURE' ? (
    <Container className={style.contentFigure}>
      <ul className={style.figure_ul}>{FigureList}</ul>
    </Container>
  ) : editMode === 'MARKET' ? (
    <div className={style.contentItem}>
      <ul className={style.item_ul}>{ItemList}</ul>
    </div>
  ) : myCurrentCtgr === 'COORDI-MY' || myCurrentCtgr === 'COORDI-RCM' ? (
    <Coordi />
  ) : (
    <div className={style.contentItem}>
      {myCurrentCtgr.includes('FAV') ? (
        isFavEmpty ? (
          EmptyFavElement
        ) : (
          <ul className={style.item_ul}>{ItemList}</ul>
        )
      ) : (
        <ul className={style.item_ul}>{ItemList}</ul>
      )}
      <ul className={style.item_ul}>{ItemList}</ul>
    </div>
  );
};

export default Item;
