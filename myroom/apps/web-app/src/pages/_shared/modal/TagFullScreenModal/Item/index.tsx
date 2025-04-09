import { FixedSizeGrid } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useItem from "./hooks";
import styles from './styles.module.scss';
import React from "react";
import SearchItemCard from "@/pages/_shared/ui/Cards/SearchItemCard";
import NotFound from "@/pages/_shared/ui/NotFound";

type ItemProps = {
    htCode: string;
}

const Item = ({ htCode}:ItemProps) => { 

    const { contentsWrapRef, totalCount, searchResult, width, height, columnCount, itemWidth, itemHeight, rowCount, fetchNextPage, handleClickAfterItem, gridStyleWithGap, gridOnItemsRendered} = useItem(htCode);
    
    const ItemRenderer = ({ rowIndex, columnIndex, style }: any) => {
        const index = rowIndex * columnCount + columnIndex;
        const currentItem = searchResult[index];
    
        if (currentItem && currentItem._id) {
            return (
                <div key={currentItem._id} style={gridStyleWithGap(style, columnIndex, 24)}>
                    <SearchItemCard itemId={currentItem._id} onAfterClick={handleClickAfterItem}/>
                </div>
            );
        }
    
        return null;
    };

    return <div className={styles['container']} ref={contentsWrapRef}>
        {totalCount > 0 ? <InfiniteLoader itemCount={totalCount} isItemLoaded={(index) => { return searchResult.length < index; }} loadMoreItems={() => { fetchNextPage() }}>
            {({ onItemsRendered, ref }) => <FixedSizeGrid className={styles['scroll-box']}
                columnCount={columnCount} columnWidth={itemWidth} rowCount={rowCount} rowHeight={itemHeight} width={width} height={height}
                onItemsRendered={(params) => gridOnItemsRendered(params, onItemsRendered)} ref={ref}>
                {ItemRenderer}
            </FixedSizeGrid>
            }
        </InfiniteLoader> : <NotFound textId="GSC.000003" icon="Allim_Empty1" />}
    </div>
      
}

export default Item;