import useFeedsAPI from '@/apis/Social/Feeds';
import { useEffect, useState } from 'react';
import { FeedData } from '@/apis/Social/Feeds/type';
import { useInView } from 'react-intersection-observer';

const useFeedList = (profileId: string) => {
  const { useFetchFeeds } = useFeedsAPI();
  const {
    data: feedsRes,
    fetchNextPage,
    hasNextPage,
  } = useFetchFeeds(profileId, { content_type: 'all' });
  const { ref: inViewRef, inView } = useInView();

  const [feedList, setFeedList] = useState<FeedData[]>([]);

  useEffect(() => {
    if (!feedsRes || !feedsRes.pages) return;
    const newList: FeedData[] = [];
    feedsRes.pages.map((page) => {
      if (page) {
        newList.push(...page.list);
      }
    });
    setFeedList(newList);
    console.log('feedList : ', newList);
  }, [feedsRes]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  return { feedList, inViewRef };
};

export default useFeedList;
