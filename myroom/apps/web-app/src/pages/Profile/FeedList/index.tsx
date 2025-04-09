import { useCallback } from 'react';
import FeedCell from '@/pages/_shared/ui/FeedUIs/FeedCell';
import useFeedList from './hooks';
import style from './style.module.scss';

const FeedList = ({ profileId }: { profileId: string }) => {
  const { feedList, inViewRef } = useFeedList(profileId);
  const ListEmpty = useCallback(() => {
    return <div></div>;
  }, []);
  const List = useCallback(() => {
    console.log('feedList.length : ', feedList.length);
    if (feedList.length <= 0) return <ListEmpty />;
    return (
      <div>
        {feedList.map((feed) => (
          <FeedCell feedData={feed} />
        ))}
        <div className={style.listEndObserver} ref={inViewRef}></div>
      </div>
    );
  }, [feedList]);
  return <List />;
};
export default FeedList;
