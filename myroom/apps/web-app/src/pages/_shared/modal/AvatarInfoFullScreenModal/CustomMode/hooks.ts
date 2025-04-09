
import React, { useState, useCallback,  useMemo } from "react";
import { useAtom } from "jotai";
import { SceneManager } from "@/common/utils/client";
import useCart from "@/common/hooks/Cart";
import useMarketAPI from "@/apis/Meta/Market";
import useReactionAPI from "@/apis/Social/Reaction";
import useCoordiAPI from "@/apis/Space/Coordi";
import useItemAPI from "@/apis/Meta/Item";
import { Category } from "@/pages/_shared/offcanvas/GalleryOffCanvas";
import { TableDataManager } from "client-core/tableData/tableDataManager";
import { currentEquipItemsAtom } from "../store";
import { ISelectButton } from "@/pages/_shared/offcanvas/SelectOffCanvas";
import { ECameraMode } from "client-core/assetSystem/controllers/cameraController";
import { DEFAULT_ACTION_ID } from "@/common/constants/avatar";
import useTranslate from '@/common/hooks/use-translate';

// 아바타 
const DEFUALT_AVATAR_ITEM_CATEGORY = '111111';
const DEFUALT_AVATAR_ITEM_SUB_CATEGORY = 'ALL';

let initialItems: string[] = [];


type useCustomModeProps = {
    profileId: string;
    avatarId: string;
    itemId?: string;
}

let originAnimation: string | undefined;

const useCustomMode = ({ itemId }: useCustomModeProps) => { 
    const { t }  = useTranslate();
    const { removeCartItem } = useCart();
    const [currentCategory, setCurrentCategory] = useState<string>(DEFUALT_AVATAR_ITEM_CATEGORY);
    const [currentSubCategory, setCurrentSubCategory] = useState<string>(DEFUALT_AVATAR_ITEM_SUB_CATEGORY);
    const [isOpenResetSheet, setIsOpenResetSheet] = useState<boolean>(false);

    const [currentEquipItems, setCurrentEquipItems] = useAtom(currentEquipItemsAtom);
    

    const { fetchMarketProductsInfi } = useMarketAPI();
    const { fetchMeItems } = useItemAPI();
    const { fetchCoordisMe } = useCoordiAPI();
    const { fetchMeReactions } = useReactionAPI();


    
    const [isMarket, setIsMarket] = useState<boolean>(true);

    const { data: productsData, isSuccess: isProductsSuccess, fetchNextPage: fetchProductsNextPage, hasNextPage: hasProductsNextPage } = fetchMarketProductsInfi({ limit: 15, category: isMarket? currentCategory : undefined, selling: currentSubCategory === 'ALL'? undefined : false});
    const { data: userItemsData, isSuccess: isUserItemsSuccess, fetchNextPage: fetchUserItemsNextPage, hasNextPage: hasUserItemsNextPage } = fetchMeItems({ page: 1, limit: 15, category: currentCategory === 'OWN' ? currentSubCategory : undefined });
    const { data: coordiData, isSuccess: isCoordiSuccess } = fetchCoordisMe({ page: 1, limit: 5 });
    const { data: reactionData, isSuccess: isReactionSuccess  } = fetchMeReactions({ page: 1, limit: 15, target_type: 'item', filter_reaction: 'like', order: 'desc', orderby: 'like' });


    /**
     * My/Market 토글
     */
    const handleToggle = useCallback(() => {
        setIsMarket(prev => !prev)

        if (!isMarket) {
            setCurrentCategory(DEFUALT_AVATAR_ITEM_CATEGORY);
            setCurrentSubCategory(DEFUALT_AVATAR_ITEM_SUB_CATEGORY);
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
        if (isMarket) {
            await fetchProductsNextPage();
        }
        else {
            await fetchUserItemsNextPage();
        }
    }, [fetchProductsNextPage, fetchUserItemsNextPage, isMarket]);

    /**
     * 아바타 카테고리
     */
    const avartarCategory = useMemo(() => {
        return Object.keys(TableDataManager.getInstance().category3).filter(x => ["HEAD", "BODY"].includes(TableDataManager.getInstance().category3[x].Parent));
    }, []);

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
            return avartarCategory.map((key) => {
                const data: Category = {
                    id: key, 
                    textId: t(TableDataManager.getInstance().category3[key].localKey),
                }

                return data;
            });
        }
        else {
            const _category: Category[] = [{ id: "COORDI", textId: 'GMY.000069' }, { id: "OWN", textId: 'GMY.000073' }, { id: "LIKE", textId: 'GMY.000074' }];
            return _category;
        }
    }, [isMarket, avartarCategory, currentCategory]);

   /**
    * 서브 카테고리
    */
    const subCategory = useMemo((): Category[] | undefined => { 
        if (isMarket) {
            return [{ id: "ALL", textId: "GCM.000008"}, { id: "FREE", textId: "GMY.000068"}];    
        }
        else {
            switch (currentCategory) {
                default:
                case "COORDI":
                    return undefined;
                case 'LIKE':
                case 'OWN':
                    return avartarCategory.map((key) => {
                        const data: Category = {
                            id: key, 
                            textId: t(TableDataManager.getInstance().category3[key].localKey)
                        }
        
                        return data;
                    });
            }
        }    
    }, [isMarket, currentSubCategory, currentCategory, avartarCategory]);

    /**
     * 카테고리 클릭
     */
    const handleClickCategory = useCallback((id: string) => { 
        setCurrentCategory(id);

        if (!isMarket) {
            if (id === 'LIKE' || id === 'OWN') {
                setCurrentSubCategory(DEFUALT_AVATAR_ITEM_CATEGORY);
            }
        }

    }, [isMarket]);

    /**
     * 서브 카테고리 클릭
     */
    const handleClickSubCategory = useCallback((id: string) => { 
        setCurrentSubCategory(id);
    }, []);

    /**
     * 아바타 초기화 창 열기
     */
    const handleClicOpenResetSheet = useCallback(() => { 
       setIsOpenResetSheet(true);
    }, []);

    /**
     * 아바타 초기화 창 닫기
     */
    const handleClicCloseResetSheet = useCallback(() => { 
        setIsOpenResetSheet(false);
     }, []);
 

    /**
     * 아바타 초기화
     */
    const handleClickReset = useCallback(() => { 
        // 230819 현재 초기화 규칙: 진입 시 아이템 장착 된 아이템으로 회귀.
        // 우선 기존 옷들을 모두 벗고, 그 다음에 입힌다 (by ulralra 230823)
        SceneManager.Avatar?.unequipAllAvatarItem();
        initialItems.map((item) => SceneManager.Avatar?.equipAvatarItem(item, () => { }));
        setCurrentEquipItems([...initialItems]);
        setIsOpenResetSheet(false);
    }, [setCurrentEquipItems]);

    /**
     * 초기화 창 버튼
     */
    const selectSheetList = useMemo(() => {
        return [
          {
            textId: 'GMY.000078',
            defaultValue: '이전 저장 상태로 돌아가기',
            onClick: handleClickReset,
          },
          {
            textId: 'GCM.000026',
            defaultValue: '취소',
            onClick: handleClicCloseResetSheet,
          },
        ] as ISelectButton[];
      }, [handleClicCloseResetSheet, handleClickReset]);

    
        
    const handleClickMarketItem = useCallback((id:string) => {
        SceneManager.Avatar?.equipAvatarItem(id, (oldId) => {
            setCurrentEquipItems(prev => [...prev.filter(x => x !== oldId), id]);

            if (oldId) {
                removeCartItem(oldId);    
            }
         });    
     }, [removeCartItem, setCurrentEquipItems]);


    const checkEquipItem = useCallback((id: string) => { 
        return currentEquipItems.includes(id);
    }, [currentEquipItems]);
    
    React.useEffect(() => {
        SceneManager.Avatar?.setCameraMode(ECameraMode.AvatarCustomizingMode); 

        SceneManager.Avatar?.makeAvatarManifest((manifest) => { 
            originAnimation = manifest?.main.animation;

            // 아바타 커스텀시 기본 애니메이션 재생
            SceneManager.Avatar?.playAnimation(DEFAULT_ACTION_ID);

            // 리셋을 위해 현재 장착된 아이템을 저장해둔다.
            SceneManager.Avatar?.getAllAvatarEquipItems((ids) => { 
                initialItems = [...ids]; 

                 // 검색등에서 아이템을 클릭하여 들어온 경우 강제로 아이템을 장착한다.
                if (itemId) {
                    handleClickMarketItem(itemId);
                }
            });
        });

     

       
        return () => { 
            initialItems = [];

            if (originAnimation) {
                SceneManager.Avatar?.playAnimation(originAnimation);
            }
        }
     }, [handleClickMarketItem, itemId]);

    return {isMarket, list, currentCategory, currentSubCategory, category, subCategory, itemCount, selectSheetList,isOpenResetSheet, fetchNextPage, handleToggle, handleClickCategory, handleClickSubCategory, handleClicOpenResetSheet, handleClicCloseResetSheet, handleClickMarketItem, checkEquipItem}
}

export default useCustomMode;