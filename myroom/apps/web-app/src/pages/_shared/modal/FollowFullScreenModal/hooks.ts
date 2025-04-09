import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import useRecommendationAPI from "@/apis/Recommendaion";
import { followTabAtom } from "@/common/stores";
import { TMenuType, TActionType, IFollowFullScreenModal } from './type';
import { t } from 'i18next';
import useSearchAPI from "@/apis/Search";
import useFollowAPI from "@/apis/User/Follow";
import useResizeObserver from "use-resize-observer";


const useFollowModal = ({
  isMine,
  profileId,
  onRequestClose,
}: IFollowFullScreenModal) => {
  
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTab, setTab] = useAtom(followTabAtom);
  const [desc, setDesc] = useState<string>('');
  const [btnText, setBtnText] = useState<string>('');
  const [btnAction, setBtnAction] = useState<TActionType>(undefined);
  
  const [followingList, setFollowingList] = useState<any>(undefined);
  const [followerList, setFollowerList] = useState<any>(undefined);

  const { 
    fetchSearchFollowing,
    fetchSearchFollower
  } = useSearchAPI();

  const {
    data: searchFollowerData,
    fetchNextPage: fetchNextPageSearchFollower,
  } = fetchSearchFollower({
    profile_id: profileId!,
    nickname: searchText,
  });

  const {
    data: searchFollowingData,
    fetchNextPage: fetchNextPageSearchFollowing,
  } = fetchSearchFollowing({
    profile_id: profileId!,
    nickname: searchText,
  });

  const {
    fetchFollowers,
    fetchFollowings
  } = useFollowAPI();

  const {
    data: followerData,
    isLoading: isLoadingFollowerData,
    fetchNextPage: fetchNextPageFollowerData,
  } = fetchFollowers({
    profile_id: profileId,
    limit: 25,
    page: 1,
    key: 'card',
  });

  const {
    data: followingData,
    isLoading: isLoadingFollowingData,
    fetchNextPage: fetchNextPageFollowingData,
  } = fetchFollowings({
    profile_id: profileId,
    limit: 25,
    page: 1,
    key: 'card',
  });

  const { 
    fetchRecommendationFollowers 
  } = useRecommendationAPI();

  const { 
    data: recommendFollowerData,
    refetch: recommendFollowerRefetch,
  } = fetchRecommendationFollowers(profileId);





  const { ref: contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
  // const { columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered } = useWindowing({width, height, itemWidth: 96, itemWidthGap: 23, itemHeight: 146});

  const totalCount = useMemo(()=>{

    if(selectedTab === 'following') {
      if(searchText.length  < 2) {
        return followingData?.pages[0]?.current.total && followingData?.pages[0]?.current.total > 0? followingData?.pages[0]?.current.total : 0;
      }
      else {
        return searchFollowingData?.pages[0]?.total && searchFollowingData?.pages[0]?.total > 0? searchFollowingData?.pages[0]?.total : 0;
      }
      
    } else {
      if(searchText.length  < 2) {
        return followerData?.pages[0]?.current.total && followerData?.pages[0]?.current.total > 0? followerData?.pages[0]?.current.total : 0;
      }
      else {
        return searchFollowerData?.pages[0]?.total && searchFollowerData?.pages[0]?.total > 0? searchFollowerData?.pages[0]?.total : 0;
      }

    }
  } ,[searchFollowingData, searchFollowerData, followerData, followingData, selectedTab, searchText]);
  

  const searchResult = useMemo(() => {

    if(selectedTab === 'following') {
      if(searchText.length < 2) {
        return followingData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
      }
      else {
        return searchFollowingData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
      }
      
    } else {
      if(searchText.length < 2) {
        return followerData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
      }
      else {
        return searchFollowerData?.pages.reduce<any>((acc, cur) => acc.concat(cur?.list), []);
      }
    }
  
  }, [searchFollowingData, searchFollowerData, followerData, followingData, selectedTab, searchText]);


  const handleChangeSearchText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // if(e.target?.value.length === 0) return;
    
    setSearchText(e.target?.value);
  }, [setSearchText]);

  const handleClickResetSearchText = useCallback(() => {
    setSearchText('');
  }, [setSearchText]);

  const handleTab = (type: TMenuType) => () => {
    setSearchText('');
    setTab(type);
  }

  const handleClose = () => {
    onRequestClose();
  };

  const handleEmptyAction = () => {
    if(btnAction === 'refresh') {
      recommendFollowerRefetch();
    } 
    else if(btnAction === 'recommendUser') {
      setTab('recommend');
    }
  };

  const handleRefresh = () => recommendFollowerRefetch();

  const handleClickAfterItem = useCallback(() => { 
    // tagFullScreenModal.deleteModal();
}, []);


  useEffect(() => {

    if (selectedTab === 'recommend') {
      setDesc(t('GPF.000009')); 
      setBtnText(t('GCM.000045')); 
      setBtnAction('refresh');
    } else if (searchText.length !== 0) {
      setDesc(t('GCM.000044'));
      setBtnText('');
      setBtnAction(undefined);
    } else {
      if(isMine) {
        setDesc(selectedTab === 'follower' 
          ? `${t('GPF.000006')} ${t('GPF.000008')}` 
          : `${t('GPF.000007')} ${t('GPF.000008')}`
        );
        setBtnText(t('GPF.000005'));
        setBtnAction('recommendUser');

      } else {
        setDesc(selectedTab === 'follower' 
          ? t('GPF.000018')
          : t('GPF.000019')
        );
        setBtnText('');
        setBtnAction(undefined);
      }
    }

  }, [isMine, selectedTab, searchText]);
  
  return {
    searchText,
    setSearchText,
    selectedTab,
    setTab,
    desc,
    setDesc,
    btnText,
    setBtnText,
    btnAction,
    setBtnAction,
    followingList, 
    setFollowingList,
    followerList, 
    setFollowerList,
    handleChangeSearchText,
    handleClickResetSearchText,
    handleTab,
    handleClose,
    handleEmptyAction,
    handleRefresh,
    recommendFollowerData,
    recommendFollowerRefetch,
    searchFollowerData,
    fetchNextPageSearchFollower,
    searchFollowingData,
    fetchNextPageSearchFollowing,
    followerData,
    isLoadingFollowerData,
    fetchNextPageFollowerData,
    followingData,
    isLoadingFollowingData,
    fetchNextPageFollowingData,
    totalCount,
    contentsWrapRef,
    width, 
    height, 
    searchResult,
    handleClickAfterItem
  }
}

export default useFollowModal;