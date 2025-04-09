import React from 'react';
import { useCallback, useState, ChangeEvent, useEffect } from 'react';
import useSearchAPI from '@/apis/Search';
import { useInView } from 'react-intersection-observer';
import throttle from 'lodash/throttle';
const useFollowSearchInput = (profileId: string) => {
  const [inputValue, setInputValue] = useState('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchFollowingList, setSearchFollowingList] =
    useState<{ _id: string }[]>();
  const { fetchSearchFollowing } = useSearchAPI();

  const {
    data: searchFollowingData,
    isLoading: isLoadingSearchFollowing,
    fetchNextPage: fetchNextPageSearchFollowing,
  } = fetchSearchFollowing({
    profile_id: profileId!,
    nickname: searchName,
  });

  const { ref: inViewRefSearchFollowing, inView: inViewSearchFollowing } =
    useInView();

  const handleChangeInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.currentTarget.value;
    if (!searchValue) {
      setSearchName('');
      setSearchFollowingList([]);
    }
    setInputValue(searchValue);
    // debouncedSearch(searchValue);
  }, []);

  const handleDeleteInput = () => {
    setSearchName('');
    setInputValue('');
    setSearchFollowingList([]);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
      debouncedSearch(inputValue);
    }
  };

  const debouncedSearch = useCallback(
    throttle((value) => setSearchName(value), 200),
    [],
  );

  useEffect(() => {
    if (inViewSearchFollowing) {
      fetchNextPageSearchFollowing();
      console.log('searchFollowingData1111');
    }
  }, [inViewSearchFollowing]);

  useEffect(() => {
    if (!searchFollowingData) return;
    setSearchFollowingList(
      searchFollowingData?.pages.flatMap((page) => page?.list || []).flat(),
    );
  }, [searchFollowingData]);

  return {
    searchName,
    inputValue,
    handleChangeInput,
    handleDeleteInput,
    handleInputKeyDown,
    inViewRefSearchFollowing,
    searchFollowingList,
    isLoadingSearchFollowing,
  };
};

export default useFollowSearchInput;
