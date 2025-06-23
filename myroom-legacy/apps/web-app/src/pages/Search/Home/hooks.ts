import useSearch from "@/common/hooks/use-search";
import { use } from "i18next";
import { useCallback, useEffect, useState } from "react";



const useSearchHome = () => {

    const { goToSearch, recentSearchList, handleClickRemoveRecentSearch } = useSearch();

    /**
     * 
     */
    const handleClickRecentSearch = useCallback((text: string) => { 
        goToSearch(text);
    }, []);

    return {recentSearchList, handleClickRecentSearch, handleClickRemoveRecentSearch}
}

export default useSearchHome;