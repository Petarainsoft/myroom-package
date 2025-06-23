import useSearchAPI from "@/apis/Search";
import useSearch from "@/common/hooks/use-search";
import useWindowing from "@/common/hooks/use-windowing";
import {  useMemo } from "react";
import useResizeObserver from "use-resize-observer";


const useMyroom = () => {
    const { query } = useSearch();
    const { ref: contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
    const { columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered } = useWindowing({width, height, itemWidth: 103, itemWidthGap: 13, itemHeight: 247});
    
    const { fetchSearchMyrooms } = useSearchAPI();

    const { data: searchMyroomsData, isLoading: isSearchLoading, fetchNextPage } = fetchSearchMyrooms({ search_string: query, limit: 15 });

    const searchResult = useMemo(() => {
        return searchMyroomsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [searchMyroomsData]);


    const totalCount = useMemo(()=>{
        return searchMyroomsData?.pages[0]?.total && searchMyroomsData?.pages[0]?.total > 0? searchMyroomsData?.pages[0]?.total : 0;
    } ,[searchMyroomsData]);

    const rowCount = useMemo(() => { 
        return Math.ceil(totalCount / columnCount);
    }, [totalCount, columnCount]);
    
    return { contentsWrapRef, width, height, searchResult , totalCount, columnCount, itemHeight, itemWidth, rowCount, fetchNextPage, gridStyleWithGap, gridOnItemsRendered}
}

export default useMyroom;