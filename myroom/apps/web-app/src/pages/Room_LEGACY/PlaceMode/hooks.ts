
import React, { useState, useCallback,  useMemo } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { SceneManager } from "@/common/utils/client";
import usePopup from "@/common/hooks/Popup/usePopup";
import useThumbnail from "@/common/hooks/use-thumbnail";
import useCart from "@/common/hooks/Cart";
import useMarketAPI from "@/apis/Meta/Market";
import useReactionAPI from "@/apis/Social/Reaction";
import useProfileAPI from "@/apis/User/Profile";
import useItemAPI from "@/apis/Meta/Item";
import { Category } from "@/pages/_shared/offcanvas/GalleryOffCanvas";
import { TableDataManager } from "client-core/tableData/tableDataManager";
import { ISelectButton } from "@/pages/_shared/offcanvas/SelectOffCanvas";
import { t } from "i18next";
import { logger } from "@/common/utils/logger";
import { 
  allPlacedFigureAtom, 
  currentMyRoomIdAtom, 
  initialRoomManifestAtom, 
  purchaseItemListAtom, 
  refreshOwnedItemFlagAtom, 
  roomObjectAtom, 
  selectedClientItemAtom, 
  selectedItemAtom, 
  selectedScreenItemIdAtom, 
  uiAppBarAtom, 
  uiPlaceModeAtom, 
  uiPlaceModeSheetSizeAtom, 
  uiSavePurchaseModeAtom,
  isEnvLightAtom
} from "@/common/stores";
import { selectionCallback } from "../callbackHelper";
import useModal from "@/common/hooks/Modal/useModal";
import useMyRoomAPI from "@/apis/Space/MyRoom";
import { useNavigate } from "react-router-dom";
import useMe from "@/common/hooks/use-me";



export type AvatarInfoStatus = 'MAIN' | 'CUSTOM' | 'EDIT_STATUS';

export const avatarInfoStatusAtom = atom<AvatarInfoStatus>('MAIN');
export const currentEquipItemsAtom = atom<string[]>([]);

// 아바타 
const DEFAULT_ITEM_CATEGORY = '13';
const DEFAULT_ITEM_SUB_CATEGORY = 'ALL';

type useCustomModeProps = {
    profileId: string;
    avatarId: string;
    itemId?: string;
}


const usePlaceModeNew = ({ profileId, avatarId, itemId }: useCustomModeProps) => { 

    const [isLoadedTableData, setLoadStatus] = useState<boolean>(false);
    const [selectedSkin, setSelectedSkin] = React.useState('');
    const [selectedItem, setSelectedItem] = useAtom(selectedItemAtom);
    const [selectedClientItem, setSelectedClientItem] = useAtom(selectedClientItemAtom);
    const [isEnvLight, setIsEnvLight] = useAtom(isEnvLightAtom);

    const setSelectedScreenItemIdItem = useSetAtom(selectedScreenItemIdAtom);
    const initialRoomManifest = useAtomValue(initialRoomManifestAtom);

    /** 새로고침 시 카테고리 설정 */
    const checkTableMgr = async () => {
      await new TableDataManager().loadTableDatas();
      setLoadStatus(true);
    }
    if (!TableDataManager.getInstance()) {
      checkTableMgr();
    }
    
    const { meRoomId } = useMe();
    const { removeCartItem } = useCart();
    const [currentCategory, setCurrentCategory] = useState<string>(DEFAULT_ITEM_CATEGORY);
    const [currentSubCategory, setCurrentSubCategory] = useState<string>(DEFAULT_ITEM_SUB_CATEGORY);
    const [isOpenResetSheet, setIsOpenResetSheet] = useState<boolean>(false);


    const CartFullScreenModal = useModal('CartFullScreenModal');
    const { mutationPatchMyroom } = useMyRoomAPI();
    const myRoomId = useAtomValue(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
    const setAllPlacedFigure = useSetAtom(allPlacedFigureAtom);
    const navigate = useNavigate();
    const [uiSavePurchaseMode, setUISavePurchaseMode] = useAtom(uiSavePurchaseModeAtom);
    const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);
    const [purchaseItemCount, setPurchaseItemCount] = useState(
      purchaseItemList.filter((data, index, self) => self.indexOf(data) === index).length,
    );
    const [refreshOwnedItemFlag, setRefreshOwnedItemFlag] = useAtom(refreshOwnedItemFlagAtom);
  
    // const { createThumbnail } = useThumbnail(); // 리팩토링 후 createScreenShot으로 변경
    const setPlaceModeSheetSize = useSetAtom(uiPlaceModeSheetSizeAtom);
    const setPlaceMode = useSetAtom(uiPlaceModeAtom);
    const setSelectedScreenIdItem = useSetAtom(selectedScreenItemIdAtom);
    const hideAppBar = useSetAtom(uiAppBarAtom);
    
    const { fetchMarketProductsInfi, fetchProduct } = useMarketAPI();
    const { fetchMeItems } = useItemAPI();
    const { fetchMyroomTemplates } = useMyRoomAPI();
    const { fetchMeReactions } = useReactionAPI();
    const { mutationPostProfile } = useProfileAPI();

    const { createThumbnail } = useThumbnail();
    const { showToastPopup } = usePopup();
    
    const [isMarket, setIsMarket] = useState<boolean>(true);

    const { data: productsData, isSuccess: isProductsSuccess, fetchNextPage: fetchProductsNextPage, hasNextPage: hasProductsNextPage } = fetchMarketProductsInfi({ limit: 15, category: isMarket? currentCategory : undefined, selling: currentSubCategory === 'ALL'? undefined : false});
    const { data: userItemsData, isSuccess: isUserItemsSuccess, fetchNextPage: fetchUserItemsNextPage, hasNextPage: hasUserItemsNextPage } = fetchMeItems({ page: 1, limit: 15, category: currentCategory === 'OWN' ? currentSubCategory : undefined });
    const { data: coordiData, isSuccess: isCoordiSuccess } = fetchMyroomTemplates(meRoomId ? meRoomId : undefined);

    const { data: reactionData, isSuccess: isReactionSuccess  } = fetchMeReactions({ page: 1, limit: 5, target_type: 'item', filter_reaction: 'like', order: 'desc', orderby: 'like' });

    //------------------
    const { data: itemData, isSuccess } = fetchProduct(selectedItem);
    const [roomObjects, setRoomObjects] = useAtom(roomObjectAtom);

    //------------------

    const fetchData = async (url: string) => {
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        return '';
      }
    };

    /** 최초 진입 시 카테고리 설정 */
    React.useLayoutEffect(() => {
      if(!TableDataManager.getInstance()) return;
      const propNumber = Object.keys(TableDataManager.getInstance().category1)
      if (propNumber.length !== 0) setLoadStatus(true);
    }, [])
    
    /**
     * My/Market 토글
    */
    const handleToggle = useCallback(() => {
        setIsMarket(prev => !prev)

        if (!isMarket) {
            setCurrentCategory(DEFAULT_ITEM_CATEGORY);
            setCurrentSubCategory(DEFAULT_ITEM_SUB_CATEGORY);
        }
        else {
            setCurrentCategory('COORDI');
        }
    }, [isMarket, setCurrentCategory]);

    /**
     * 아이템 리스트
     */
    const list = useMemo(() => {
        if (isMarket) {
            if (isProductsSuccess) {
                return productsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
            }
        }
        else {
            if (currentCategory === 'COORDI' && isCoordiSuccess) {
                if (isCoordiSuccess && coordiData && coordiData.list) {
                    // 맨앞에 코디추가 버튼을 위한 데이터 추가
                    return [{_id: "PLUS", count: coordiData.list.length }, ...coordiData.list];
                }
            }
            else if (currentCategory === 'OWN') {
                if(isUserItemsSuccess)
                    return userItemsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
            }
            else {
                if(isReactionSuccess)
                    return reactionData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
            }
        }

        return [];
    }, [isMarket, isProductsSuccess, productsData, currentCategory, isCoordiSuccess, coordiData, isUserItemsSuccess, userItemsData, isReactionSuccess, reactionData]);

    /**
     * 다음 페이지 가져오기
     */
    const fetchNextPage = useCallback(async () => {
      logger.log('fetchProductsNextPage')
      if (isMarket) {
        logger.log('fetchProductsNextPage')
        await fetchProductsNextPage();
      }
      else {
        logger.log('fetchUserItemsNextPage')
        await fetchUserItemsNextPage();
      }
    }, [fetchProductsNextPage, fetchUserItemsNextPage, isMarket]);

    /**
     * 룸 카테고리
     */
    const roomCategory = useMemo(() => {

      logger.log('TABLE' , isLoadedTableData)
      if(!isLoadedTableData) return;
      logger.log('TABLE' , TableDataManager.getInstance())
      logger.log('TEST1 ', TableDataManager.getInstance().category1 );
      logger.log('TEST2 ', TableDataManager.getInstance().category2 );
      logger.log('TEST3 ', TableDataManager.getInstance().category3 );
      const skin = Object.keys(TableDataManager.getInstance().category1).filter(x => ["MYROOMSKIN"].includes(TableDataManager.getInstance().category1[x].Name));
      const item= Object.keys(TableDataManager.getInstance().category1).filter(x => ["MYROOMITEM"].includes(TableDataManager.getInstance().category1[x].Name));
      const figure = Object.keys(TableDataManager.getInstance().category3).filter(x => ["FIGURE"].includes(TableDataManager.getInstance().category3[x].Name));
      const light = Object.keys(TableDataManager.getInstance().category3).filter(x => ["MYROOMLIGHT"].includes(TableDataManager.getInstance().category3[x].Name));
      const combinedCategory = [...item, ...figure, ...skin, ...light ];

      return combinedCategory;
    }, [isLoadedTableData]);

    /**
     * 아이템 갯수
     */
    const itemCount = useMemo(() => { 
        if (isMarket) {
            return hasProductsNextPage? list.length + 1 : list.length ;
        }
        else {
            return hasUserItemsNextPage? list.length + 1 : list.length ;
        }
    }, [isMarket, list, hasProductsNextPage, hasUserItemsNextPage]);

    /**
     * 카테고리
     */
    const category = useMemo((): Category[] => {
        if (isMarket) {
            if(!isLoadedTableData || !roomCategory) return [];
            return roomCategory.map((key) => {
              logger.log('TEST --- ', key)
              if(key.length <= 2) {
                const data: Category = {
                    id: key, textId: TableDataManager.getInstance().category1[key].Text
                }
                
                return data;
              } else {
                const data: Category = {
                    id: key, textId: TableDataManager.getInstance().category3[key].localKey
                }

                return data;
              }

            });
        }
        else {
            const _category: Category[] = [{ id: "COORDI", textId: 'GMY.000069' }, { id: "OWN", textId: 'GMY.000073' }, { id: "LIKE", textId: 'GMY.000074' }];
    
            return _category;
        }
    }, [isLoadedTableData, isMarket, roomCategory, currentCategory]);

   /**
    * 서브 카테고리
    */
    const subCategory = useMemo((): Category[] | undefined => { 
        if (isMarket) {

            let targetCategory: Category[] = [];
            const allNfree = [{ id: "ALL", textId: "GCM.000008", selected: currentSubCategory === 'ALL' }, { id: "FREE", textId: "GMY.000068",  selected: currentSubCategory === 'FREE' }]; 

            if(currentCategory === '12')  {
              /** 스킨 */
              const skinCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["INDOOR", "OUTDOOR"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
              const subCates: Category[] = skinCategory.map(v => { 
                  const key = v[0];
                  return {
                    id: TableDataManager.getInstance().category3[key].ID,
                    textId: TableDataManager.getInstance().category3[key].localKey,
                    selected: key === currentCategory
                  }
              });
              targetCategory = [...allNfree, ...subCates];

            } else if(currentCategory === '13') {
              /** 아이템 */
              const itemCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["FLOOR", "WALL", "RUG"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
              const subCates: Category[] = itemCategory.map(v => { 
                  const key = v[0];
                  return {
                    id: TableDataManager.getInstance().category3[key].ID,
                    textId: TableDataManager.getInstance().category3[key].localKey,
                    selected: key === currentCategory
                  }
              });
              targetCategory = [...allNfree, ...subCates];

            } else if(currentCategory === '131116') { 
              /** 피규어 - 서브카테고리 없음 */
            } else if(currentCategory === '122111') { 
              /** 조명 */
              targetCategory = [...allNfree];
            } else {

              /** 전체/무료 제외한 서브카테고리 선택 시, 예외처리 */
              const cateString = currentCategory.substring(0, 4);
              if(cateString.length !== 4 ) return;
              const currentCate = TableDataManager.getInstance().category2[cateString].Parent

              if (currentCate === 'MYROOMSKIN') {
                const skinCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["INDOOR", "OUTDOOR"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
                const subCates: Category[] = skinCategory.map(v => { 
                    const key = v[0];
                    return {
                      id: TableDataManager.getInstance().category3[key].ID,
                      textId: TableDataManager.getInstance().category3[key].localKey,
                      selected: key === currentCategory
                    }
                });
                targetCategory = [...allNfree, ...subCates];
              }
              else if (currentCate === 'MYROOMITEM') {
                const itemCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["FLOOR", "WALL", "RUG"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
                const subCates: Category[] = itemCategory.map(v => { 
                    const key = v[0];
                    return {
                      id: TableDataManager.getInstance().category3[key].ID,
                      textId: TableDataManager.getInstance().category3[key].localKey,
                      selected: key === currentCategory
                    }
                });
                targetCategory = [...allNfree, ...subCates];
              }

            }

            return targetCategory; 
        }
        else {

            if(currentCategory === 'COORDI') {
              return undefined;
            }
            else if(currentCategory === 'OWN' || currentCategory === 'LIKE' ) {
              const allNfree = [{ id: "ALL", textId: "GCM.000008", selected: currentSubCategory === 'ALL' }, { id: "FREE", textId: "GMY.000068",  selected: currentSubCategory === 'FREE' }]; 
              const itemCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["FLOOR", "WALL", "RUG"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
              const subCates: Category[] = itemCategory.map(v => { 
                  const key = v[0];
                  return {
                    id: TableDataManager.getInstance().category3[key].ID,
                    textId: TableDataManager.getInstance().category3[key].localKey,
                    selected: key === currentSubCategory
                  }
              });
              return [...allNfree, ...subCates];
            }
            else {
              const allNfree = [{ id: "ALL", textId: "GCM.000008", selected: currentSubCategory === 'ALL' }, { id: "FREE", textId: "GMY.000068",  selected: currentSubCategory === 'FREE' }]; 
              const itemCategory = Object.entries(TableDataManager.getInstance().category3).filter(entry => ["FLOOR", "WALL", "RUG"].includes(TableDataManager.getInstance().category3[entry[0]].Parent)) 
              const subCates: Category[] = itemCategory.map(v => { 
                  const key = v[0];
                  return {
                    id: TableDataManager.getInstance().category3[key].ID,
                    textId: TableDataManager.getInstance().category3[key].localKey,
                    selected: key === currentSubCategory
                  }
              });
              return [...allNfree, ...subCates];
            }
        }    

    }, [isMarket, currentSubCategory, currentCategory, roomCategory]);

    /**
     * 카테고리 클릭
     */
    const handleClickCategory = useCallback((id: string) => { 
      logger.log('handleClickCategory ', id)
        if(id === '122111') setIsEnvLight(true)
        else setIsEnvLight(false)
        setCurrentCategory(id);
        if (!isMarket) {
            if (id === 'LIKE' || id === 'OWN') {
                setCurrentSubCategory(DEFAULT_ITEM_CATEGORY);
            }
        }

    }, [isMarket]);

    /**
     * 서브 카테고리 클릭
     */
    const handleClickSubCategory = useCallback((id: string) => { 

        if(id === 'ALL' || id === 'FREE') {
          setCurrentSubCategory(id);
        } else {
          setCurrentCategory(id);
          setCurrentSubCategory(id);
        }

    }, []);

    /**
     * 룸 초기화 창 열기
     */
    const handleClickOpenResetSheet = useCallback(() => { 
       setIsOpenResetSheet(true);
    }, []);

    /**
     * 룸 초기화 창 닫기
     */
    const handleClickCloseResetSheet = useCallback(() => { 
        setIsOpenResetSheet(false);
     }, []);
 

    /**
     * 룸 이전 상태 초기화
     */
    const handleClickReset = useCallback(() => { 
      setIsOpenResetSheet(false);
      SceneManager.Room?.clearMyRoom();
      SceneManager.Room?.initializeMyRoom(initialRoomManifest, false, () => {
        SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
          selectionCallback,
        );
      });
    }, []);

    /**
    * 룸 전체 초기화
    */
    const handleTotalReset = useCallback(() => { 
      SceneManager.Room?.makeMyRoomManifest((manifest) => {
        setIsOpenResetSheet(false);
        if (!manifest || !manifest.main) {
          return;
        }

        manifest.main.items?.map((item) => {
          SceneManager.Room?.removeItemsByItemId({
            itemId: item.itemId,
            callback: () => {},
          });
        });

        manifest.main.figures?.map((item) => {
          if (!item.isAvatar) {
            SceneManager.Room?.removeFigure(item.avatarId);
          }
        });
      });
    }, []);

    /**
     * 룸 저장
     */
    const handleRoomSave = async () => {
      logger.log('handleRoomSave ', uiSavePurchaseMode);
  
      if (uiSavePurchaseMode === 'S') {
        const callback = async (manifest: any) => {
          
          
          createThumbnail(SceneManager.Room, async (imageId) => { 
            logger.log('handleRoom save 1 ', imageId)
  
            logger.log('handleRoomSave roomManifest ', manifest);
            if (!manifest) return;
            const resourceData: any = { image: [], video: [], thumbnail: imageId };
            const itemFuncData = manifest.main.itemFunctionDatas;
            if(itemFuncData) {
              itemFuncData.map((data: {
                functionData: string;
                instanceId: string;
                linkAlias: string;
                linkUrl: string;
                mediaType: number;
              }) => {
                if(data.functionData) {
                  const isImage = data.functionData.includes('image');
                  const isVideo = data.functionData.includes('video');
                  const dataStrings = data.functionData.split('/');
                  const resourceId = dataStrings[dataStrings.length - 1].split('.')[0];
                  if(isImage) resourceData.image.push(resourceId);
                  else if(isVideo) resourceData.video.push(resourceId);
                } else {
                  // do nothing
                }
    
                resourceData.thumbnail = imageId;
              });
            }
    
            const res = await mutationPatchMyroom.mutateAsync({
              id: myRoomId,
              data: {
                manifest: manifest,
                resource: resourceData
              }
            });
            logger.log('handleRoomSave res ', res);
            if (res && !res.error) {
              SceneManager.Room?.getAllFigureIds((ids) => setAllPlacedFigure(ids));
              SceneManager.Room?.endMyRoomPlacementMode();
              setPlaceMode(false);
              hideAppBar(false);
              setUISavePurchaseMode('S');
              setSelectedItem('');
              setSelectedScreenIdItem('');
              setPlaceModeSheetSize(false);
    
              const purchaseListIsNotEmpty = purchaseItemList.length > 0;
              if (purchaseListIsNotEmpty) setPurchaseItemList([]);
    
              SceneManager.Room?.clearMyRoom();
              showToastPopup({ titleText: t('#저장이 완료되었습니다.') });
              navigate('/home');
            } else {
              showToastPopup({ titleText: t('#저장이 실패하였습니다.') });
            }
          });
  
        };
  
        SceneManager.Room?.makeMyRoomManifest(callback);
  
      } else {
        CartFullScreenModal.createModal({
          productList: purchaseItemList,
          onProductBuy: (boughtIds: string[]) => {
            RemovePurchaseIds(boughtIds);
            setRefreshOwnedItemFlag(!refreshOwnedItemFlag);
          },
          onProductDelete: (removeIds: string[]) => {
            RemovePlacedItemByItemId(removeIds);
          },
        });
      }
    };
  
    const RemovePlacedItemByItemId = (ids: string[]) => {
      logger.log('RemovePlacedItemByItemId - ', ids);
      let newList = [...purchaseItemList];
      let removeNum = ids.length;
      ids.map((id) => {
        newList = newList.filter((item) => item._id != id);
        SceneManager.Room?.removeItemsByItemId({
          itemId: id,
          callback: () => {
            removeNum = removeNum - 1;
            if (removeNum == 0) {
              setPurchaseItemList(newList);
            }
          },
        });
      });
    };
  
    const RemovePurchaseIds = (ids: string[]) => {
      logger.log(
        'RemovePurchaseIds - ',
        ids,
        ' purchaseItemList: ',
        purchaseItemList,
      );
      let newList = [...purchaseItemList];
      ids.map((id) => {
        newList = newList.filter((item) => item._id != id);
      });
      setPurchaseItemList(newList);
      logger.log('RemovePurchaseIds - newList : ', newList);
    };

    /**
     * 초기화 창 버튼
    */
    const selectSheetList = useMemo(() => {
      return [
        {
          textId: 'GMY.000078',
          defaultValue: '이전 저장 상태로 돌아가기',
          onClick: () => {
            handleClickReset();
            setIsOpenResetSheet(false);
            setSelectedClientItem('');
          },
        },
        {
          textId: 'GMY.000079',
          defaultValue: '전체 초기화',
          onClick: () => {
            handleTotalReset();
            setIsOpenResetSheet(false);
            setSelectedClientItem('');
          },
        },
        {
          textId: 'GCM.000026',
          defaultValue: '취소',
          onClick: () => setIsOpenResetSheet(false),
        },
      ] as ISelectButton[];
    }, [handleClickCloseResetSheet, handleClickReset]);

    React.useEffect(() => {
      logger.log('handleClickMarketItem1 ', itemData)
      if(currentCategory !== '12') return;
      if(!itemData || itemData!.error ) return;

      const data = itemData.data;
      const resourceUrl: Array<string> = data.resource.thumbnail.split('/');
      resourceUrl.pop();
      resourceUrl.push('placeinfo.json');
      const templateManifestUrl = resourceUrl.join('/');

      fetchData(templateManifestUrl).then((templateManifest) => {
        SceneManager.Room?.changeRoomSkin(templateManifest);
      });

      // if (item.option.price.type === 1) return;
      // if (isInPurchaseItemList(id)) return;
      // if (isOwnItem(id)) return;
      // if (isPlaced(id)) return;
      // setPurchaseItemList((prev) => [...prev, item]);
    }, [itemData, currentCategory]);

    
        
    const handleClickMarketItem = useCallback((id:string) => {
      logger.log('handleClickMarketItem ', currentCategory)
      logger.log('handleClickMarketItem ', isEnvLight)
      logger.log('handleClickMarketItem ', itemData)

      if(currentCategory === '12')  {
        setSelectedSkin(id);
        setSelectedItem(id);


      } else if(currentCategory === '122111') {
        SceneManager.Room?.changeEnvironment(
          id,
          () => {
            logger.log('handleClickMarketItem cb ')
          }
        )
      } else {
        setSelectedItem(id);
        setSelectedScreenItemIdItem(id);
        SceneManager.Room?.placeNewItem({
          itemId: id,
          callback: (_id) => {
            if (_id === '')
              showToastPopup({ titleText: t('배치 공간이 부족합니다.') });
            SceneManager.Room?.getAllItemIds((ids) => setRoomObjects(ids));
          },
        });
      }

     }, [itemData, removeCartItem, currentCategory, setRoomObjects]);


    // const checkEquipItem = useCallback((id: string) => { 
    //     return currentEquipItems.includes(id);
    // }, [currentEquipItems]);


    return {
      isMarket, 
      list, 
      currentCategory, 
      currentSubCategory, 
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
      handleRoomSave
    }
}

export default usePlaceModeNew;