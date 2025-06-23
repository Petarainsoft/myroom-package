import style from './style.module.scss';
import FeedItem from '../FeedItem';
import ItemNone from '../ItemNone';
import useFollowItem from '../useFollowItem';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import React from 'react';
import { useAtom } from 'jotai';
import { figureShowcaseTabAtom } from '../store';
import { useNavigationActions } from '../item.hook';

interface IFeedList {
  isActive: boolean;
  isMe: boolean;
  list?: { _id: string }[];
  isLoading: boolean;
  profileId: string;
}
const FeedList = ({
  isActive,
  isMe,
  list,
  isLoading,
  profileId,
}: IFeedList) => {
  const { inViewRefShowcaseFeed } = useFollowItem(profileId);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { handleInitializeLocation } = useNavigationActions();
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [tab] = useAtom(figureShowcaseTabAtom);
  const LoadingOrEmpty = () => {
    if (isLoading) {
      return <div>loading</div>;
    }
    if (list?.length === 0) {
      return <ItemNone isMe={isMe} />;
    }
  };

  useEffect(() => {
    const profileId = location.state?.profileId;
    if (!profileId || !itemRefs.current[profileId]) return;
    // 해당 아이템의 위치로 스크롤;

    if (profileId && itemRefs.current[profileId]) {
      itemRefs.current[profileId]!.scrollIntoView();
      handleInitializeLocation(tab);
    }
  }, [location.state, list]);

  if (!isActive) return <></>;

  return (
    <div className={style.figureShowcaseFeedListWrapper} ref={contentRef}>
      <LoadingOrEmpty />
      <div className={style.itemListWrapper}>
        {list?.map((item, index) => (
          <FeedItem
            key={`${item._id}-${index}`}
            isMe={isMe}
            profileId={item._id}
            ref={(el) => (itemRefs.current[item._id] = el)}
          />
        ))}
        <div className={style.inView} ref={inViewRefShowcaseFeed}></div>
      </div>
    </div>
  );
};

export default FeedList;
