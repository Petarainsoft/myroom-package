import GalleryOffCanvas from "@/pages/_shared/offcanvas/GalleryOffCanvas";
import React, { useCallback, useMemo } from "react"
import usePlace from "./hooks";
import MarketItemCard from "@/pages/_shared/ui/Cards/MarketItemCard";
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import styles from './styles.module.scss';
import SelectOffCanvas from "@/pages/_shared/offcanvas/SelectOffCanvas";
import ColorAction from "./ColorAction";
import { RoomCategory } from "./type";
import FigureCard from "@/pages/_shared/ui/Cards/FigureCard";
import { ItemRectCard, ItemRectPlusCard } from "@/pages/_shared/ui/Cards/ItemRectCard";
import { TRASH_TABLES } from "@/common/hooks/use-trash";

const Place = () => {
    const {list, itemCount, hideRoomPlaceUI, mainCategory, subCategory, isMarket, currentSelectedItem, showResetSheet, resetSheetButtons, selectedId, currentCategory, currentSubCategory, notFound, showCoordiSheet, showTrash, currentTrashCategory, trashCount, setShowResetSheet, setShowTrash, coordiSheetButtons, handleClickCoordiChange, handleClickCategory, handleClickSubCategory, handleToggle, handleClickHideCoordiSheet, handleClickMarketItem, handleClickActionSetting, handleClickActionRemove, handleClickActionRotation, handleClickCoordi, handleClickAddCoordi, fetchNextPage, handleClickTrashItem, handleClickTrashFigure} = usePlace();
    

    const ItemAction = useCallback(()=>{
        if(hideRoomPlaceUI) return;

        return <React.Fragment>
            {currentSelectedItem && <div className={styles['action-box']}>
                {currentSelectedItem.type === 'ITEM' && <CircleButton size={"l"} onClick={handleClickActionSetting}>
                    <Icon name="Setting_S"/>
                </CircleButton>}
                <CircleButton size={"m"} onClick={handleClickActionRotation}>
                    <Icon name="Rotation_S"/>
                </CircleButton>
                {currentSelectedItem.type !== 'AVATAR' && <CircleButton size={"l"} onClick={handleClickActionRemove}>
                    <Icon name="Erase_S"/>
                </CircleButton>}
            </div>}
        </React.Fragment>
    },[currentSelectedItem, handleClickActionRemove, handleClickActionRotation, handleClickActionSetting, hideRoomPlaceUI]);


    const Item = useCallback((props:{index:number})=>{
        const { index } = props;

        const data = list[index];
        if(!data) {
            return null;
        }

        if (showTrash) {
            if (currentTrashCategory === TRASH_TABLES.ITEM) { 
                return <MarketItemCard key={data._id} id={data.itemId} hasFunction={data.functionData} instanceId={data._id} onClick={() => handleClickTrashItem(data._id, data.itemId, data.functionData)} disabledLiked/>
            }
            else {
                return <FigureCard avatarId={data._id} onAfterClick={()=> handleClickTrashFigure(data._id)}/>
            }
        }

        switch(currentCategory) {
            case RoomCategory.FIGURE:
                return <FigureCard profileId={data._id} />
            case RoomCategory.MY_ITEM:
                return <MarketItemCard key={data.item_id} id={data.item_id} onClick={()=> handleClickMarketItem(data.item_id)} selected={selectedId === data.item_id}/>
            case RoomCategory.SCRAP:
                return <MarketItemCard key={data._id.target_id} id={data._id.target_id} onClick={()=> handleClickMarketItem(data._id.target_id)} selected={selectedId === data._id.target_id}/>
            case RoomCategory.SYS_COORDI:
                return <ItemRectCard key={data._id} thumbnail={data.resource.thumbnail} onClick={()=> handleClickCoordiChange(false, data._id)}/>
            case RoomCategory.COORDI:
                return index === 0? <ItemRectPlusCard max={5} count={list.length - 1} onClick={handleClickAddCoordi}/> : <ItemRectCard key={data._id} thumbnail={data.resource.thumbnail} onClick={()=> handleClickCoordi(data._id)}/>
            default:
                return <MarketItemCard key={data._id} id={data._id} onClick={()=> handleClickMarketItem(data._id)} selected={selectedId === data._id}/>
        }
    },[list, showTrash, currentCategory, currentTrashCategory, handleClickTrashItem, selectedId, handleClickAddCoordi, handleClickMarketItem, handleClickCoordiChange, handleClickCoordi, handleClickTrashFigure]);

    const shape = useMemo(() => {
        if (showTrash) {
            return currentTrashCategory === TRASH_TABLES.ITEM ? "square" : 'rect';
        }
        else {
            return currentCategory === RoomCategory.FIGURE || currentCategory ===  RoomCategory.SYS_COORDI || currentCategory === RoomCategory.COORDI? "rect" : "square";
        }
    },[currentCategory, currentTrashCategory, showTrash]);
    

    return <React.Fragment>
        <GalleryOffCanvas 
            category={mainCategory}
            subCategory={subCategory}
            isMarket={isMarket}
            onClickCategory={handleClickCategory}
            onClickSubCategory={handleClickSubCategory}
            onToggle={handleToggle}
            disabledToggle={showTrash}
            actionArea={{
                start: <CircleButton size="l" onClick={() => setShowTrash(prev => !prev)} variant={showTrash ? "primary" : "defualt"} badge={{variant:"black", count: trashCount}}>
                        <Icon name={'Erase'} />
                    </CircleButton>,
                center: <ItemAction />,
                end: !hideRoomPlaceUI && <CircleButton size="l" onClick={() => setShowResetSheet(true)}>
                    <Icon name={'Reset_M'} />
                </CircleButton>
            }}
            contents={{
                shape,
                itemCount: itemCount,
                isItemLoaded: (idx) => list.length > idx,
                loadMoreItems: fetchNextPage,
                elementId: (idx) => list[idx]?._id,
                element: (idx) => <Item index={idx} />
            }}
            notFound={notFound}
            currentCategory={showTrash? RoomCategory.TRASH : currentCategory}
            currentSubCategory={showTrash ? currentTrashCategory : currentSubCategory}
            categoryArea={showTrash && <CircleButton size={"xxs"} className={styles['trash-close']} shape="none" border="none" variant="none" onClick={()=> setShowTrash(false)}>
                <Icon name="Close_Bottom_S" />
            </CircleButton>}
            subCategoryArea={currentCategory === RoomCategory.LIGHT && <ColorAction />}
            />
        <SelectOffCanvas
            key={"RESET_OFFCANVAS"}
            isOpen={showResetSheet}
            onClose={()=> setShowResetSheet(false)}
            buttonList={resetSheetButtons} />
        <SelectOffCanvas
            key={"COORDI_OFFCANVAS"}
            isOpen={showCoordiSheet}
            onClose={handleClickHideCoordiSheet}
            buttonList={coordiSheetButtons}/>
    </React.Fragment>
}

export default Place;