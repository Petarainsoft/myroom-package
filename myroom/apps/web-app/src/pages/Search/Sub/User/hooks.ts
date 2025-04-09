import useSearchAPI from "@/apis/Search";
import useSearch from "@/common/hooks/use-search";
import { useMemo } from "react";



const useUser = () => {
    const { query } = useSearch();

    const { fetchSearchProfilesInfinity } = useSearchAPI();


    const { data: searchProfiles, isLoading: isSearchLoading, fetchNextPage } = fetchSearchProfilesInfinity({ search_string: query, limit: 15 });

    const searchResult = useMemo(() => {
        return searchProfiles?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [searchProfiles]);


    const totalCount = useMemo(()=>{
        return searchProfiles?.pages[0]?.total && searchProfiles?.pages[0]?.total > 0? searchProfiles?.pages[0]?.total : 0;
    } ,[searchProfiles]);

    return { searchResult, totalCount, fetchNextPage}
}

export default useUser;