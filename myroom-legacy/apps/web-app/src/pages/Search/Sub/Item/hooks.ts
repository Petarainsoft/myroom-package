import useSearchAPI from "@/apis/Search";
import useSearch from "@/common/hooks/use-search";
import useWindowing from "@/common/hooks/use-windowing";
import { useMemo } from "react";
import useResizeObserver from "use-resize-observer";



const useItem = () => {
    const { query } = useSearch();
    const { ref: contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
    const { columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered } = useWindowing({width, height, itemWidth: 96, itemWidthGap: 23, itemHeight: 146});
    
    const { fetchSearchItems } = useSearchAPI();

    const { data: searchItemsData, isLoading: isSearchLoading, fetchNextPage } = fetchSearchItems({ search_string: query, limit: 15 });

    const searchResult = useMemo(() => {
        return searchItemsData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [searchItemsData]);


    const totalCount = useMemo(()=>{
        return searchItemsData?.pages[0]?.total && searchItemsData?.pages[0]?.total > 0? searchItemsData?.pages[0]?.total : 0;
    } ,[searchItemsData]);

    const rowCount = useMemo(() => { 
        return Math.ceil(totalCount / columnCount);
    }, [totalCount, columnCount]);
    
    
    return { contentsWrapRef, width, height, searchResult , totalCount, columnCount, itemHeight, itemWidth, rowCount, gridStyleWithGap, gridOnItemsRendered, fetchNextPage}
}

export default useItem;