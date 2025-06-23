import { FixedSizeGrid } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useItem from "./hooks";
import styles from './styles.module.scss';
import React from "react";
import SearchItemCard from "@/pages/_shared/ui/Cards/SearchItemCard";
import SearchCount from "../../_shared/SearchCount";
import Container from "@/pages/_shared/layouts/Container";
import NotFound from "@/pages/_shared/ui/NotFound";


const Item = () => { 

    const { contentsWrapRef, totalCount, searchResult, width, height, columnCount, itemWidth, itemHeight, rowCount, gridStyleWithGap, gridOnItemsRendered, fetchNextPage} = useItem();
    
    const ItemRenderer = ({ rowIndex, columnIndex, style }: any) => {
        const index = rowIndex * columnCount + columnIndex;
        const currentItem = searchResult[index];
    
        if (currentItem && currentItem._id) {
            return (
                <div key={currentItem._id} style={gridStyleWithGap(style, columnIndex)}>
                    <SearchItemCard itemId={currentItem._id} />
                </div>
            );
        }
    
        return null;
    };
    
    return <Container className={styles['wrap']}>
        {totalCount > 0? <React.Fragment>
            <SearchCount count={totalCount} />
            <div className={styles['container']} ref={contentsWrapRef}>
                <InfiniteLoader itemCount={totalCount} isItemLoaded={(index) => { return searchResult.length < index; }} loadMoreItems={() => { fetchNextPage() }}>
                    {({ onItemsRendered, ref }) => <FixedSizeGrid className={styles['scroll-box']}
                        columnCount={columnCount} columnWidth={itemWidth} rowCount={rowCount} rowHeight={itemHeight} width={width} height={height}
                        onItemsRendered={(params) => gridOnItemsRendered(params, onItemsRendered)} ref={ref}>
                        {ItemRenderer}
                    </FixedSizeGrid>
                    }
                </InfiniteLoader>
            </div>
        </React.Fragment> : <NotFound icon="Allim_Empty1" textId="GSC.000003"/>}
    </Container>
}

export default Item;