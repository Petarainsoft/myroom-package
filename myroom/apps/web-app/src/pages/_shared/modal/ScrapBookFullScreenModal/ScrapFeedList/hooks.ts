import { FeedData } from '@/apis/Social/Feeds/type';
import { useState } from 'react';
import useScrapFolder from '../useScrapFolder';
const SCRAP_FOLDER_NAME = 'feeds';
const SCRAP_FOLDER_TYPE = 'feeds';
const useScrapFeedList = () => {
  const { contentsIds } = useScrapFolder(SCRAP_FOLDER_NAME, SCRAP_FOLDER_TYPE);
  // TODO : get feeds .
  const [feedList, setFeedList] = useState<FeedData[]>([]);
  console.log(contentsIds, setFeedList);
  return { feedList };
};
export default useScrapFeedList;
