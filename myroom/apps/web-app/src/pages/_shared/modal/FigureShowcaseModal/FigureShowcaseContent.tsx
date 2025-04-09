import './style.scss';
import { useEffect } from 'react';
import Tab from './Tab';
import CardList from './CardList';
import FeedList from './FeedList';
import {
  showCaseIsCommentOpenAtom,
  showcaseStatusMessageCommentAtom,
} from '@/common/stores';
import { useAtom } from 'jotai';
import useFollowItem from './useFollowItem';
import { EFigureShowcaseTab, figureShowcaseTabAtom } from './store';
import { useLocation } from 'react-router-dom';
import CommentOffCanvas from '../../offcanvas/CommentOffCanvas';
import { usePlacedFigures } from './item.hook';

interface IFigureShowcaseContent {
  profileId: string;
  isMe: boolean;
}

const FigureShowcaseContent = ({ profileId, isMe }: IFigureShowcaseContent) => {
  const [tab, setTab] = useAtom(figureShowcaseTabAtom);
  const location = useLocation();
  const {
    followDataCard,
    followingsDataFeed,
    isLoadingFollowDataCard,
    isLoadingFollowingsDataFeed,
    isLoadingFollowMeData,
  } = useFollowItem(profileId);
  const [showcaseStatusMessageComment, setShowcaseStatusMessageComment] =
    useAtom(showcaseStatusMessageCommentAtom);
  const [showCaseIsCommentOpen, setShowCaseIsCommentOpen] = useAtom(
    showCaseIsCommentOpenAtom,
  );

  //내 마이룸인 경우 마이룸에 배치된 피규어 아이템 검사
  usePlacedFigures(isMe);

  useEffect(() => {
    return () => {
      setShowcaseStatusMessageComment({ targetId: '', targetProfileId: '' });
      setShowCaseIsCommentOpen(false);
      setTab(EFigureShowcaseTab.CARD);
    };
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, []);

  return (
    <>
      <Tab currentTab={tab} setCurrentTab={setTab} />
      <CardList
        isActive={tab === EFigureShowcaseTab.CARD}
        isMe={isMe}
        isLoading={Boolean(isLoadingFollowDataCard || isLoadingFollowMeData)}
        list={followDataCard?.pages.flatMap((page) => page?.list || []).flat()}
        profileId={profileId}
      />
      <FeedList
        isActive={tab === EFigureShowcaseTab.FEED}
        isMe={isMe}
        isLoading={Boolean(
          isLoadingFollowingsDataFeed || isLoadingFollowMeData,
        )}
        list={followingsDataFeed?.pages
          .flatMap((page) => page?.list || [])
          .flat()}
        profileId={profileId}
      />
      <CommentOffCanvas
        targetId={showcaseStatusMessageComment.targetId}
        targetProfileId={showcaseStatusMessageComment.targetProfileId}
        isOpen={showCaseIsCommentOpen}
        onClose={() => setShowCaseIsCommentOpen(false)}
      />
    </>
  );
};

export default FigureShowcaseContent;
