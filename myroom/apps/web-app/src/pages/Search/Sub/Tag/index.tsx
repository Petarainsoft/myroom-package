import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useTag from "./hooks";
import useResizeObserver from "use-resize-observer";
import styles from './styles.module.scss';
import React from "react";
import TagCard from "@/pages/_shared/ui/Cards/TagCard";
import SearchCount from "../../_shared/SearchCount";
import Container from "@/pages/_shared/layouts/Container";
import NotFound from "@/pages/_shared/ui/NotFound";

const Tag = () => { 
    const { ref : contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
    const { totalCount, searchTagList } = useTag();
    
    return <Container className={styles['wrap']}>
        {totalCount > 0? <React.Fragment>
            <SearchCount count={totalCount} />
            <div className={styles['container']} ref={contentsWrapRef}>
                <InfiniteLoader itemCount={searchTagList?.length} isItemLoaded={() => true} loadMoreItems={() => { }} >
                    {({ onItemsRendered, ref }) => <FixedSizeList onItemsRendered={onItemsRendered} ref={ref}  height={height}
                    itemCount={searchTagList?.length}
                    itemSize={60}
                    width={width}
                >
                            {({ index, style }: any) => {
                            return searchTagList && searchTagList.length > index && <div style={style}><TagCard hashtag={searchTagList[index].hashtag} htCode={searchTagList[index].ht_code} itemCount={searchTagList[index].count.item} pingCount={searchTagList[index].count.ping} /></div>
                            }}    
                        </FixedSizeList>
                    }
                </InfiniteLoader>
            </div>
        </React.Fragment> : <NotFound icon="Allim_Empty1" textId="GSC.000003"/>}
    </Container>
}

export default Tag;