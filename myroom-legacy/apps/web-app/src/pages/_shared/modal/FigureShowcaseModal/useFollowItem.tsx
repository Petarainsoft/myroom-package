import useFollowAPI from '@/apis/User/Follow';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const useFollowItem = (profileId: string) => {
  const { fetchFollowings } = useFollowAPI();
  const { ref: inViewRefShowcaseCard, inView: inViewShowcaseCard } =
    useInView();
  const { ref: inViewRefShowcaseFeed, inView: inViewShowcaseFeed } =
    useInView();
  const {
    data: followDataCard,
    isLoading: isLoadingFollowDataCard,
    fetchNextPage: fetchNextPageFollowDataCard,
  } = fetchFollowings({
    profile_id: profileId,
    limit: 15,
    page: 1,
    key: 'card',
  });

  const {
    data: followingsDataFeed,
    isLoading: isLoadingFollowingsDataFeed,
    fetchNextPage: fetchNextPageFollowingsDataFeed,
  } = fetchFollowings({
    profile_id: profileId,
    limit: 15,
    page: 1,
    key: 'feed',
  });

  const {
    data: followMeData,
    isLoading: isLoadingFollowMeData,
    fetchNextPage: fetchNextPageFollowMeData,
  } = fetchFollowings({
    profile_id: 'me',
  });

  useEffect(() => {
    if (inViewShowcaseCard) {
      fetchNextPageFollowDataCard();
    }
  }, [inViewShowcaseCard]);

  useEffect(() => {
    if (inViewShowcaseFeed) {
      fetchNextPageFollowingsDataFeed();
    }
  }, [inViewShowcaseFeed]);

  return {
    inViewRefShowcaseCard,
    inViewShowcaseCard,
    inViewRefShowcaseFeed,
    inViewShowcaseFeed,
    followDataCard,
    followingsDataFeed,
    isLoadingFollowDataCard,
    isLoadingFollowingsDataFeed,
    fetchNextPageFollowDataCard,
    fetchNextPageFollowingsDataFeed,
    followMeData,
    isLoadingFollowMeData,
    fetchNextPageFollowMeData,
  };
};

export default useFollowItem;
