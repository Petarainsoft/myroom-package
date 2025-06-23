import useSearchAPI from "@/apis/Search";
import { useCallback, useMemo } from "react";
import useResizeObserver from "use-resize-observer";
import useModal from "@/common/hooks/Modal/useModal";
import useWindowing from "@/common/hooks/use-windowing";


const useItem = (htCode: string) => {
    const tagFullScreenModal = useModal('TagFullScreenModal');
    const { ref: contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();

    const { columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered } = useWindowing({width, height, itemWidth: 96, itemWidthGap: 23, itemHeight: 146});
    
    const { fetchSearchItemsMatch } = useSearchAPI();

    const { data: searchItemsData, isLoading: isSearchLoading, fetchNextPage } = fetchSearchItemsMatch({ ht_code: htCode, limit: 15 });

    const searchResult = useMemo(() => {
        return searchItemsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [searchItemsData]);


    const totalCount = useMemo(()=>{
        return searchItemsData?.pages[0]?.total && searchItemsData?.pages[0]?.total > 0? searchItemsData?.pages[0]?.total : 0;
    } ,[searchItemsData]);

    const rowCount = useMemo(() => { 
        return Math.ceil(totalCount / columnCount);
    }, [totalCount, columnCount]);
    
    const handleClickAfterItem = useCallback(() => { 
        tagFullScreenModal.deleteModal();
    }, [tagFullScreenModal]);

    
    return { contentsWrapRef, width, height, searchResult , totalCount, columnCount, itemHeight, itemWidth, rowCount, fetchNextPage, gridStyleWithGap, gridOnItemsRendered, handleClickAfterItem}
}

export default useItem;