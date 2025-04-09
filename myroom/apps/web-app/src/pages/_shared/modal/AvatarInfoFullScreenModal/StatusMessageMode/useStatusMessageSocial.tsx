import useReactionAPI from '@/apis/Social/Reaction';
import { MyReactionsRes } from '@/apis/Social/Reaction/type';

import { useEffect, useState } from 'react';

const useStatusMessageSocial = (id: string) => {
  const { mutationPostReaction, fetchMyReaction, fetchReaction } =
    useReactionAPI();
  const [statusMessageCommentNum, setStatusMessageCommentNum] = useState(0);
  const [statusMessageLikeNum, setStatusMessageLikeNum] = useState(0);
  const [isStatusMessageLiked, setIsStatusMessageLiked] = useState(false);
  //리액션 실행 시 나의 리액션 여부
  const {
    data: statusMessageMyReactionData,
    isLoading: isLoadingStatusMessageMyReaction,
  } = fetchMyReaction(id);

  //리액션 개수 업데이트
  const { data: reactionData, isLoading: isLoadingReaction } =
    fetchReaction(id);

  const useGetStatusMessageSocialReaction = (detailData: any) => {
    // console.log('좋아요 number', detailData);
    if (detailData?.error) {
      setStatusMessageCommentNum(0);
      setStatusMessageLikeNum(0);
      return;
    }
    if (detailData?.data) {
      setStatusMessageCommentNum(detailData.data.stat.comment);
      setStatusMessageLikeNum(detailData.data.stat.reaction.like);
    }
  };

  const useCheckLikeStatus = (listData: MyReactionsRes) => {
    // console.log('좋아요 상태변화', listData);
    if (listData?.error) {
      setIsStatusMessageLiked(false);
      return;
    }
    if (listData?.data) {
      const likeStatus = listData.data.stat.reaction.like;
      if (likeStatus > 0) {
        setIsStatusMessageLiked(true);
        return;
      }
      if (likeStatus === 0) {
        setIsStatusMessageLiked(false);
        return;
      }
    }
  };

  //좋아요
  const handlePostLikeStatusMessage = async () => {
    const res = await mutationPostReaction.mutateAsync({
      id,
      params: { origin_profile_id: id, reaction: 'like' },
    });
    if (!res) return;
  };

  useEffect(() => {
    if (isLoadingReaction) return;
    if (!reactionData) return;
    useGetStatusMessageSocialReaction(reactionData);
  }, [isLoadingReaction, reactionData]);

  useEffect(() => {
    if (isLoadingStatusMessageMyReaction) return;
    if (!statusMessageMyReactionData) return;
    useCheckLikeStatus(statusMessageMyReactionData);
  }, [isLoadingStatusMessageMyReaction, statusMessageMyReactionData]);

  return {
    statusMessageLikeNum,
    isStatusMessageLiked,
    statusMessageCommentNum,
    useGetStatusMessageSocialReaction,
    handlePostLikeStatusMessage,
    useCheckLikeStatus,
    isLoadingStatusMessageMyReaction,
  };
};

export default useStatusMessageSocial;
