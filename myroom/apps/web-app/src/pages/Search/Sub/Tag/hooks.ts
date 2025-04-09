import useSearchAPI from "@/apis/Search";
import useSearch from "@/common/hooks/use-search";
import { useMemo } from "react";


const useTag = () => {
    const { query } = useSearch();
    
    const { fetchSearchTags } = useSearchAPI();


    const { data: searchTag, isLoading: isSearchLoading } = fetchSearchTags({ search_string: query, limit: 15 });

    const searchTagList = useMemo(() => {
        return searchTag?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [searchTag]);


    const totalCount = useMemo(()=>{
        return searchTag?.pages[0]?.total && searchTag?.pages[0]?.total > 0? searchTag?.pages[0]?.total : 0;
    } ,[searchTag]);

    return { searchTagList, totalCount }
}

export default useTag;