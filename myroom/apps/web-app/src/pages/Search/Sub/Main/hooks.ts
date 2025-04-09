import { useMemo } from 'react';
import useSearchAPI from "@/apis/Search";
import useSearch from "@/common/hooks/use-search";



const useSearchSubMain = () => {
    const { query, handleClickTab } = useSearch();

    const { fetchSearchProfilesInfinity, fetchSearchTags, fetchSearchMyrooms, fetchSearchItems } = useSearchAPI();

    const { data: profileData, isLoading: isProfileLoading } = fetchSearchProfilesInfinity({ search_string: query, limit: 15 });
    const { data: tagData, isLoading: isTagLoading } = fetchSearchTags({ search_string: query, limit: 15 });
    const { data: roomData, isLoading: isRoomLoading } = fetchSearchMyrooms({ search_string: query, limit: 15 });
    const { data: itemData, isLoading: isItemLoading } = fetchSearchItems({ search_string: query, limit: 15 });

    const searchProfileList = useMemo(() => {
        const list = profileData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
        return list?.length > 5?  list.slice(0, 5) : list;
    }, [profileData]);

    const searchTagList = useMemo(() => {
        return tagData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [tagData]);

    const searchMyroomList = useMemo(() => {
        return roomData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [roomData]);

    const searchItemList = useMemo(() => {
        return itemData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
    }, [itemData]);

    const isNotFound = useMemo(() => {
        return searchProfileList && searchProfileList.length <= 0 && searchTagList && searchTagList.length <= 0 && searchMyroomList && searchMyroomList.length <= 0 && searchItemList && searchItemList.length <= 0;
    }, [searchItemList, searchMyroomList, searchProfileList, searchTagList]);

    return { searchProfileList, searchTagList, searchMyroomList, searchItemList, isNotFound, handleClickTab}
}

export default  useSearchSubMain;