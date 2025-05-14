import useRoom from "@/common/hooks/use-room";
import { SceneManager } from "@/common/utils/client";
import { DragInfo, SelectionInfo } from "client-core/assetSystem/controllers/roomSubSystem/InputHandler_PlaceMode";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomCategory, RoomSubCategory, SelectedItem } from "./type";
import useMarketAPI from "@/apis/Meta/Market";
import { ISelectButton } from "@/pages/_shared/offcanvas/SelectOffCanvas";
import useModal from "@/common/hooks/Modal/useModal";
import useRoomSkin from "@/common/hooks/use-room-skin";
import useItemAPI from "@/apis/Meta/Item";
import useMyRoomAPI from "@/apis/Space/MyRoom";
import useReactionAPI from "@/apis/Social/Reaction";
import { EItemCategory1, EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import useRoomCoordi from "@/common/hooks/use-room-coordi";
import { t } from "i18next";
import usePopup from "@/common/hooks/Popup/usePopup";
import { useSearchParams } from "react-router-dom";
import { NotFoundProps } from "@/pages/_shared/ui/NotFound";
import useTrash, { TRASH_TABLES } from "@/common/hooks/use-trash";
import { RemoveInfo } from "client-core/assetSystem/controllers/roomSubSystem/ItemPlacementManager";
import { IMyRoomItemFunctionData } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import useCart from "@/common/hooks/Cart";


const usePlace = () => {
    const { removeCartItem } = useCart();
    const { add, remove, itemList, figureList } = useTrash();
    const [searchParams] = useSearchParams();
    const { fetchMarketProductsInfi } = useMarketAPI();
    const { fetchMeItems } = useItemAPI();
    const { fetchMyroomTemplates, mutationDelMyroomTemplate } = useMyRoomAPI();
    const { fetchMeReactions } = useReactionAPI();

    const { showToastPopup, showConfirmPopup } = usePopup();
    const {currentRoomInfo, hideRoomPlaceUI, setHideRoomPlaceUI, meRoomManifest, setMeRoomManifest} = useRoom();
    const itemFullScreenModal = useModal('ItemFullScreenModal');
    const { fetchSkinManifest } = useRoomSkin();
    const { fetchMyCoordiManifest, fetchSystemCoordiManifest, changeRoomCoordi, postMyroomCoordi} = useRoomCoordi();

    const [currentCategory, setCurrentCategory] = useState<RoomCategory>(RoomCategory.ITEM);
    const [currentSubCategory, setCurrentSubCategory] = useState<RoomSubCategory>(RoomCategory.ITEM);
    const [currentTrashCategory, setCurrentTrashCategory] = useState<TRASH_TABLES>(TRASH_TABLES.ITEM);
    const [isMarket, setIsMarket] = useState(true);
    const [showTrash, setShowTrash] = useState(false);
    const [currentSelectedItem, setCurrentSelectedItem] = useState<SelectedItem | null>(null);
    const [showResetSheet, setShowResetSheet] = useState(false);
    const [showCoordiSheet, setShowCoordiSheet] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);



    const {data : productsData, isSuccess: isProductsDataSuccess, hasNextPage: hasProductsNextPage, fetchNextPage: fetchProductsNextPage} = fetchMarketProductsInfi({category: currentSubCategory === 'FREE'? currentCategory : currentSubCategory, limit: 15, selling: currentSubCategory === 'FREE'? false : undefined });
    const {data: userItemsData, isSuccess: isUserItemsSuccess, fetchNextPage: fetchUserItemsNextPage, hasNextPage: hasUserItemsNextPage } = fetchMeItems({ page: 1, limit: 15, category: currentCategory === RoomCategory.MY_ITEM ? currentSubCategory : undefined });
    const {data: roomTemplatesData, isSuccess: isRoomTemplatesSuccess } = fetchMyroomTemplates(currentRoomInfo?.id);
    const {data: reactionData, isSuccess: isReactionSucces, hasNextPage : hasReactionNextPage } = fetchMeReactions({ page: 1, limit: 15, target_type: 'item', filter_reaction: 'like', order: 'desc', orderby: 'like' });


    

    const handleToggle = useCallback(() => {
        if(isMarket) {
            setCurrentCategory(RoomCategory.COORDI);
            setCurrentSubCategory(RoomCategory.COORDI);
        }
        else {
            setCurrentCategory(RoomCategory.ITEM);
            setCurrentSubCategory(RoomCategory.ITEM);
        }
        setIsMarket(!isMarket);
    }, [isMarket]);

    const mainCategory = useMemo(() => {
        if (showTrash) {
            return [{id: RoomCategory.TRASH, textId : "휴지통", descId:"꾸미기 도중 버려진 아이템 또는 피규어가 휴지통에 임시로 보관되며, 카테고리 별로 최대 100개까지 보관됩니다. 휴지통은 꾸미기가 종료되면 자동으로 비워집니다."}];
        }

        if(isMarket) {
            return [
                {id : RoomCategory.ITEM, textId: "아이템"},
                {id : RoomCategory.FIGURE, textId: "피규어"},
                {id : RoomCategory.SKIN, textId: "스킨"},
                {id: RoomCategory.LIGHT, textId: "조명"} //조명
            ];
        }
        else {
            return [
                {id : RoomCategory.COORDI, textId: "내 코디"},
                {id : RoomCategory.SYS_COORDI, textId: "추천 코디"},
                {id : RoomCategory.MY_ITEM, textId: "내 아이템"},
                {id: RoomCategory.MY_SKIN, textId: "내 스킨"},
                {id: RoomCategory.SCRAP, textId: "스크랩"} 
            ];
        }
    },[isMarket, showTrash]);

    const subCategory = useMemo(() => {
        if (showTrash) {
            return [
                { id: TRASH_TABLES.ITEM, textId: "아이템" },
                { id: TRASH_TABLES.FIGURE, textId: "피규어" },
            ]
        }

        switch(currentCategory) {
            case RoomCategory.ITEM:
                return [
                    {id: RoomCategory.ITEM, textId: "GCM.000008"},
                    {id: "FREE", textId: "GMY.000068"},
                    {id: EItemCategory3.STATUE.toString(), textId: "GCA.000009"},
                    {id: EItemCategory3.FUNITURE.toString(), textId: "GCA.000010"},
                    {id: EItemCategory3.STACKABLE.toString(), textId: "GCA.000011"},
                    {id: EItemCategory3.PILLAR.toString(), textId: "GCA.000012"},
                    {id: EItemCategory3.PROP.toString(), textId: "GCA.000013"},
                    {id: EItemCategory3.WALLHANGING.toString(), textId: "GCA.000014"},
                    {id: EItemCategory3.TABLEMAT.toString(), textId: "GCA.000015"},
                ];
            case RoomCategory.SKIN:
                return [
                    {id: RoomCategory.SKIN, textId: "GCM.000008"},
                    {id: "FREE", textId: "GMY.000068"},
                    {id: EItemCategory3.SINGLEROOM.toString(), textId: "GCA.000005"},
                    {id: EItemCategory3.DUPLEXROOM.toString(), textId: "GCA.000006"},
                    {id: EItemCategory3.GARDEN.toString(), textId: "GCA.000007"},
                    {id: EItemCategory3.FACADE.toString(), textId: "GCA.000008"},
                ];
            case RoomCategory.LIGHT:
                return [
                    {id: RoomCategory.LIGHT, textId: "GCM.000008"},
                    {id: "FREE", textId: "GMY.000068"},
                ];
            case RoomCategory.MY_ITEM:
                return [
                    {id: RoomCategory.ITEM, textId: "GCM.000008"},
                    {id: EItemCategory3.STATUE.toString(), textId: "GCA.000009"},
                    {id: EItemCategory3.FUNITURE.toString(), textId: "GCA.000010"},
                    {id: EItemCategory3.STACKABLE.toString(), textId: "GCA.000011"},
                    {id: EItemCategory3.PILLAR.toString(), textId: "GCA.000012"},
                    {id: EItemCategory3.PROP.toString(), textId: "GCA.000013"},
                    {id: EItemCategory3.WALLHANGING.toString(), textId: "GCA.000014"},
                    {id: EItemCategory3.TABLEMAT.toString(), textId: "GCA.000015"},
                ];
            case RoomCategory.MY_SKIN:
                return [
                    {id: RoomCategory.SKIN, textId: "GCM.000008"},
                    {id: EItemCategory3.SINGLEROOM.toString(), textId: "GCA.000005"},
                    {id: EItemCategory3.DUPLEXROOM.toString(), textId: "GCA.000006"},
                    {id: EItemCategory3.GARDEN.toString(), textId: "GCA.000007"},
                    {id: EItemCategory3.FACADE.toString(), textId: "GCA.000008"},
                    {id: RoomCategory.LIGHT, textId: "GMY.000181"},
                ]
        }
        
        return undefined;
    },[currentCategory, showTrash]);

    const notFound = useMemo(() : NotFoundProps | undefined => {
        switch(currentCategory) {
            case RoomCategory.FIGURE:
                return {
                    action:{
                        textId: "GMY.000115",
                        onClick:()=>{}
                    },
                    textId:"GMY.000114",
                };
            case RoomCategory.SCRAP:
                return {
                    icon: "Heart_One_L",
                    textId:"GMY.000188",
                };
            default:
                return undefined;
        }
    },[currentCategory]);

     /**
     * 아이템 리스트
     */
    const list = useMemo(() => {
        if (showTrash) {
            if(currentTrashCategory === TRASH_TABLES.ITEM) {
                return itemList;
            }
            else {
                return figureList;
            }
        }

        switch(currentCategory) {
            case RoomCategory.FIGURE: 
                // if(isFollowingsDataSuccess && followingsData?.list) {
                //     return followingsData?.list;
                // }
                break;
            case RoomCategory.MY_ITEM:
                if(isUserItemsSuccess) {
                    return userItemsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
                }
                break;
            case RoomCategory.COORDI:
                if(isRoomTemplatesSuccess) {
                    return [{_id:"PLUS"}, ...roomTemplatesData.list];
                }
                break;

            case RoomCategory.SCRAP:
                if(isReactionSucces) {
                    return reactionData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
                }
                break;
            default:
                if(isProductsDataSuccess) {
                    return productsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
                }
                break;
        }

        return [];
    }, [showTrash, currentCategory, currentTrashCategory, itemList, figureList, isUserItemsSuccess, isRoomTemplatesSuccess, isReactionSucces, isProductsDataSuccess, userItemsData, roomTemplatesData, reactionData, productsData]);

    /**
     * 아이템 갯수
     */
    const itemCount = useMemo(() => { 
        if (showTrash) {
            return list.length;    
        }

        switch(currentCategory) {
            case RoomCategory.FIGURE: 
                return list.length;
            case RoomCategory.MY_ITEM:
                return hasUserItemsNextPage? list.length + 1 : list.length ;
            case RoomCategory.COORDI:
                    return list.length;
            case RoomCategory.SCRAP:
                return hasReactionNextPage? list.length + 1 : list.length ;
            default:
                return hasProductsNextPage? list.length + 1 : list.length ;
        }
    }, [currentCategory, list, hasProductsNextPage, hasUserItemsNextPage, hasReactionNextPage, showTrash]);


    const trashCount = useMemo(() => { 
        return itemList.length + figureList.length;
    }, [figureList.length, itemList.length]);

    const handleClickCategory = useCallback((category:RoomCategory)=>{
        setCurrentCategory(category);

        if(category === RoomCategory.MY_ITEM){
            setCurrentSubCategory(EItemCategory1.MYROOMITEM.toString());
        }
        else if(category === RoomCategory.MY_SKIN){
            setCurrentSubCategory(EItemCategory1.MYROOMSKIN.toString());
        }
        else {
            setCurrentSubCategory(category);
        }
    },[]);

    const handleClickSubCategory = useCallback((category: string | TRASH_TABLES) => {
        if (showTrash) {
            if(category === 'ITEM') {
                setCurrentTrashCategory(TRASH_TABLES.ITEM);
            }
            else {
                setCurrentTrashCategory(TRASH_TABLES.FIGURE);
            }
        }
        else {
            setCurrentSubCategory(category);
        }
    },[showTrash]);

    /**
    * 다음 페이지 가져오기
    */
    const fetchNextPage = useCallback(async () => {
        if (currentCategory === RoomCategory.MY_ITEM) {
            await fetchUserItemsNextPage();
        }
        else {
            await fetchProductsNextPage();
        }
    }, [fetchProductsNextPage, fetchUserItemsNextPage, currentCategory]);

    const handleClickMarketItem = useCallback(async (itemId:string) => {
        switch(currentCategory) {
            case RoomCategory.SCRAP:
            case RoomCategory.MY_ITEM:
            case RoomCategory.ITEM:
                {
                    SceneManager.Room?.placeNewItem({itemId, callback:(id)=>{
                        if(id === '') {
                            showToastPopup({titleText: t('GMY.000110')});
                        } 
                    }});
                    break;
                }
            case RoomCategory.MY_SKIN:
            case RoomCategory.SKIN:
                {
                    const manifest = await fetchSkinManifest(itemId);
                    if(manifest) {
                        SceneManager.Room?.changeRoomSkin(manifest, (success)=>{
                            if(success) {
                                setSelectedId(itemId);
                            }
                        });
                    }
                    break;
                }
            case RoomCategory.LIGHT:
                SceneManager.Room?.changeEnvironment(itemId, () => {});
                break;
                
        }      
    }, [currentCategory, fetchSkinManifest, showToastPopup]);

    
    const handleClickTrashItem = useCallback(async (id: string, itemId: string, functionData?: IMyRoomItemFunctionData | null) => {
        SceneManager.Room?.placeNewItem({itemId, itemInstanceId: id, callback:(newId)=>{
            if(id !== '') {
                remove(TRASH_TABLES.ITEM, id);
                SceneManager.Room?.doItemFunction_MyRoom(newId, { instanceId: newId, ...functionData });
            } 
            else {
                showToastPopup({titleText: t('GMY.000110')});
            }
        }});
    }, [remove, showToastPopup]);

    const handleClickTrashFigure = useCallback(async (id: string) => {
        remove(TRASH_TABLES.FIGURE, id);
    }, [remove]);

    const handleClickActionRemove = useCallback(()=>{
        if(currentSelectedItem) {
            if(currentSelectedItem.type === 'ITEM') {
                SceneManager.Room?.removeItem(currentSelectedItem.id);
            }
            else if(currentSelectedItem.type === 'FIGURE') {
                SceneManager.Room?.removeFigure(currentSelectedItem.id);
            }
            else {
                // 아바타는 삭제 불가
            }

            setCurrentSelectedItem(null);
        }
            
    }, [currentSelectedItem]);

    const handleClickActionSetting = useCallback(()=>{
        if(currentSelectedItem && currentSelectedItem.type === 'ITEM') {
            itemFullScreenModal.createModal({
                itemId: currentSelectedItem.itemId,
                itemInstanceId: currentSelectedItem.id,
                mode: 'SETTING',
            });
        }
        else {
            //로그
        }
            
    }, [currentSelectedItem, itemFullScreenModal]);

    const handleClickActionRotation = useCallback(()=>{
        if(currentSelectedItem) {
            SceneManager.Room?.rotateSelectedItemOrFigure();
        }
    }, [currentSelectedItem]);

    /**
     * 초기화 창 버튼
    */
    const resetSheetButtons = useMemo(() => {
        return [
            {
                textId: 'GMY.000078',
                onClick: () => {
                    if(meRoomManifest) {
                        SceneManager.Room?.clearMyRoom();
                        SceneManager.Room?.initializeMyRoom(meRoomManifest, false, ()=>{
                            SceneManager.Room?.startMyRoomPlacementMode(); 
                        });

                        setShowResetSheet(false);
                    }
                },
            },
            {
                textId: 'GMY.000079',
                onClick: () => {
                    SceneManager.Room?.makeMyRoomManifest((manifest) => {

                        setShowResetSheet(false);

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
                },
            },
            {
                textId: 'GCM.000026',
                onClick: () => setShowResetSheet(false),
            },
        ] as ISelectButton[];
    }, [meRoomManifest]);

    const callbackRoomPlacementSelectionChanged = useCallback((info: SelectionInfo)=>{
        const id = info.getId();
        if(id !== '') {
            setCurrentSelectedItem({
                id,
                itemId:info.getItemId(),
                type: info.isFigure()? (currentRoomInfo?.avatarId === id? 'AVATAR' : "FIGURE") : "ITEM",
            })
        }
        else {
            setCurrentSelectedItem(null);
        }
    },[currentRoomInfo]);

    
    
    const callbackRoomPlacementDragEvent = useCallback((info: DragInfo)=>{
        const isDrag = info.isDragging();
        if(isDrag) {
            if(!hideRoomPlaceUI)
                setHideRoomPlaceUI(true);
        }
        else {
            setHideRoomPlaceUI(false);
        }
      
    },[hideRoomPlaceUI]);

    const handleClickCoordiChange = useCallback(async (myCoordi:boolean, id:string)=>{
        if(currentRoomInfo) {
           let manifest;
           if(myCoordi) {
                manifest = await fetchMyCoordiManifest(currentRoomInfo?.id, id);
           }
           else {
                manifest = await fetchSystemCoordiManifest(id, currentRoomInfo.avatarId);
           }
           
           if(manifest) {
               changeRoomCoordi(manifest);

               SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
               SceneManager.Room?.addCallbackRoomPlacementDragEvent(callbackRoomPlacementDragEvent);
           }
        }
    },[currentRoomInfo, fetchMyCoordiManifest, fetchSystemCoordiManifest, changeRoomCoordi, callbackRoomPlacementSelectionChanged, callbackRoomPlacementDragEvent]);

    const handleClickAddCoordi = useCallback(async ()=>{
        if(currentRoomInfo) {
            //- 코디 슬롯 체크
            if (roomTemplatesData?.data?.length >= 5) {
                showToastPopup({ titleText: t('GMY.000087') });
                return;
            }
        
            postMyroomCoordi(currentRoomInfo?.id, () => {
                SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
                SceneManager.Room?.addCallbackRoomPlacementDragEvent(callbackRoomPlacementDragEvent);
            });
        }
    },[currentRoomInfo, roomTemplatesData, postMyroomCoordi, showToastPopup, callbackRoomPlacementSelectionChanged, callbackRoomPlacementDragEvent]);


    const handleClickCoordiRemove = useCallback(async () => {
        if (currentRoomInfo && selectedId) {
          await mutationDelMyroomTemplate.mutateAsync({ id:currentRoomInfo?.id ,templateId: selectedId });
          setShowCoordiSheet(false);
        }
      }, [currentRoomInfo, selectedId, mutationDelMyroomTemplate]);
    
    const handleClickCoordiRemoveConfirm = useCallback(async () => {
        showConfirmPopup({
          titleText: t('GMY.000086'),
          onConfirm: handleClickCoordiRemove,
        });
    }, [handleClickCoordiRemove, showConfirmPopup]);
    
    const handleClickCoordi = useCallback((id:string) => { 
        setShowCoordiSheet(true);
        setSelectedId(id);
    }, []);

    const handleClickHideCoordiSheet = useCallback(() => { 
        setShowCoordiSheet(false);
        setSelectedId(null);
    }, []);

    const coordiSheetButtons = useMemo(() => {
       
        const actions: ISelectButton[] = [
            {
                textId: 'GMY.000081',
                onClick: () => {
                    handleClickCoordiChange(true, selectedId!);
                    setShowCoordiSheet(false);
                },
            },
            { 
                textId: 'GMY.000082',
                onClick: handleClickCoordiRemoveConfirm,
            },
        ];
        
        return actions;
    }, [handleClickCoordiChange, handleClickCoordiRemoveConfirm, selectedId]);
    
    /**
     * 룸 아이템 Click Callback
     */
    useEffect(()=>{
        SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
        return ()=> {
            SceneManager.Room?.removeCallbackPlacementSelectionChanged(callbackRoomPlacementSelectionChanged);
        }
    }, [callbackRoomPlacementSelectionChanged]);


    /**
     * 룸 아이템 Drag Callback
     */
    useEffect(()=>{
        SceneManager.Room?.addCallbackRoomPlacementDragEvent(callbackRoomPlacementDragEvent);
        return ()=> {
            SceneManager.Room?.removeCallbackRoomPlacementDragEvent(callbackRoomPlacementDragEvent);
        }
    }, [callbackRoomPlacementDragEvent]);

    /**
     * 초기 셋팅
     */
    useEffect(()=>{
        SceneManager.Room?.startMyRoomPlacementMode(); 

        const itemId = searchParams.get("itemId");
        if(itemId) {
            handleClickCategory(RoomCategory.ITEM);
            handleClickMarketItem(itemId);
        }

        const skinId = searchParams.get("skinId");
        if(skinId) {
            handleClickCategory(RoomCategory.SKIN);
            handleClickMarketItem(skinId);
        }

        SceneManager.Room?.makeMyRoomManifest((manifest)=> {
            if(manifest) {
                setSelectedId(manifest.main.room.roomSkinId);
                setMeRoomManifest(manifest);
            }
        });

        return ()=> {
            SceneManager.Room?.endMyRoomPlacementMode();
            setMeRoomManifest(null);
        }
    }, []);    

    const callbackRoomPlacementRemoveEvent = useCallback((info: RemoveInfo) => {
        const id = info.getId();
        const itemId = info.getItemId();

        add(info.isFigure() ? TRASH_TABLES.FIGURE : TRASH_TABLES.ITEM, {
            _id: id,
            itemId: itemId,
            functionData : info.getItemData(),
        });
        
        removeCartItem(itemId);
    }, [add, removeCartItem]);
    
    useEffect(() => {
        SceneManager.Room?.addCallbackRoomPlacementRemoveEvent(callbackRoomPlacementRemoveEvent);
        
        return () => {
            SceneManager.Room?.removeCallbackRoomPlacementRemoveEvent(callbackRoomPlacementRemoveEvent);
        }
     }, [callbackRoomPlacementRemoveEvent]);

    return {list, itemCount, hideRoomPlaceUI, mainCategory, subCategory, isMarket, currentSelectedItem, showResetSheet, resetSheetButtons, selectedId, currentCategory, currentSubCategory, notFound, showCoordiSheet, coordiSheetButtons, showTrash, currentTrashCategory, trashCount, setShowTrash, handleClickCoordiChange, setShowResetSheet, handleClickCoordi, handleClickHideCoordiSheet, handleClickActionRemove, handleClickActionRotation, handleClickCategory, handleClickSubCategory, handleClickMarketItem, handleToggle, handleClickActionSetting, handleClickAddCoordi, fetchNextPage, handleClickTrashItem, handleClickTrashFigure}
}

export default usePlace;