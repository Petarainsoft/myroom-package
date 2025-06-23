import { useCallback } from 'react';
import FeedCell from '@/pages/_shared/ui/FeedUIs/FeedCell';
import style from './style.module.scss';
import useScrapFeedList from './hooks';

const FeedList = () => {
  const { feedList } = useScrapFeedList();
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
        <div className={style.listEndObserver} ref={null}></div>
      </div>
    );
  }, [feedList]);
  return <List />;
};
export default FeedList;
