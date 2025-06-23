import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useUser from "./hooks";
import { ProfileCard } from "@/pages/_shared/ui/Cards/ProfileCard";
import useResizeObserver from "use-resize-observer";
import styles from './styles.module.scss';
import React from "react";
import SearchCount from "../../_shared/SearchCount";
import Container from "@/pages/_shared/layouts/Container";
import NotFound from "@/pages/_shared/ui/NotFound";


const User = () => { 
    const { ref : contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
    const { totalCount, searchResult, fetchNextPage } = useUser();
    
    return <Container className={styles['wrap']}>
        {totalCount > 0? <React.Fragment>
            <SearchCount count={totalCount} />
            <div className={styles['container']} ref={contentsWrapRef}>
                <InfiniteLoader itemCount={searchResult?.length} isItemLoaded={(index) => { return searchResult.length < index;  }} loadMoreItems={() => { fetchNextPage()}} >
                    {({ onItemsRendered, ref }) => <FixedSizeList onItemsRendered={onItemsRendered} ref={ref}  height={height}
                    itemCount={searchResult?.length}
                    itemSize={74}
                    width={width}
                >
                            {({ index, style }: any) => {
                                return searchResult && searchResult.length > index && <div style={style}><ProfileCard profileId={searchResult[index]._id} disableDesc /></div>
                            }}    
                        </FixedSizeList>
                    }
                </InfiniteLoader>
            </div>
        </React.Fragment> : <NotFound icon="Allim_Empty1" textId="GSC.000003"/>}
    </Container>
}

export default User;