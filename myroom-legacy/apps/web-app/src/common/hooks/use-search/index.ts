import queryString from "query-string";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useLocalStorage from "use-local-storage";




const useSearch = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { keyword } = useParams();
    const [recentSearchList, setRecentSearchList] = useLocalStorage<string[]>("RECENT_SEARCH_LIST", []);

    /**
     * 
     */
    const query = useMemo(() => { 
        const parsed = queryString.parse(location.search);
        return parsed.q ? parsed.q as string : undefined;
    }, [location.search]);
    
    /**
     * 
     */
    const handleClickTab = useCallback((type?: string) => {
        navigate(queryString.stringifyUrl({ url: type? `/search/${type}` : '/search', query: { q: query } }));
    }, [navigate, query]);


    /**
     * 
     */
    const goToSearch = useCallback((text?: string) => { 
        navigate(queryString.stringifyUrl({ url: location.pathname, query: { q: text } }));    

        if (text) {
            const updateList = [text, ...recentSearchList.filter(x => x !== text)].slice(0, 10);
            setRecentSearchList([...updateList]);    
        }
    }, [location.pathname, navigate, recentSearchList, setRecentSearchList]);


    /**
     * 
     */
    const handleClickRemoveRecentSearch = useCallback((text: string) => { 
        setRecentSearchList([...recentSearchList.filter((x) => x !== text)])
    }, [recentSearchList, setRecentSearchList]);


    return {query, keyword, goToSearch, recentSearchList, handleClickTab, handleClickRemoveRecentSearch}
}

export default useSearch;