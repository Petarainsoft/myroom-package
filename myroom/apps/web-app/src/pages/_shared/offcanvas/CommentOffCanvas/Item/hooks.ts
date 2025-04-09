import useCommentAPI from '@/apis/Social/Comment';
import useReactionAPI from '@/apis/Social/Reaction';
import useProfileAPI from '@/apis/User/Profile';
import usePopup from '@/common/hooks/Popup/usePopup';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { t } from 'i18next';
import { useInView } from 'react-intersection-observer';
import useMe from '@/common/hooks/use-me';
import { ISelectButton } from '@/pages/_shared/offcanvas/SelectOffCanvas';

const useCommentItem = (
  targetId: string,
  targetProfileId: string,
  commentId: string,
  profileId: string,
  parentId?: string,
  mentionId?: string,
) => {
  const { meProfileId } = useMe();
  const { ref: inViewRef, inView } = useInView();
  const { showConfirmPopup, showToastPopup } = usePopup();
  const { fetchComments, mutationDelComment } = useCommentAPI();
  const { fetchProfile } = useProfileAPI();
  const { fetchMyReaction, fetchReaction, mutationPostReaction } =
    useReactionAPI();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isEdit, setEdit] = useState(false);
  const [isChildrenWrite, setIsChildrenWrite] = useState(false);
  const [isChildrenRead, setIsChildrenRead] = useState(false);

  const {
    data: childrenCommentsData,
    fetchNextPage: fetchChildrenCommentNextPage,
  } = fetchComments({
    target_id: targetId,
    parent_id: commentId,
    order: 'desc',
    limit: 15,
    orderby: 'recent',
  });

  const { data: profileData, isLoading: isProfileLoading } =
    fetchProfile(profileId);

  const { data: mentionData } = fetchProfile(mentionId);

  const { data: reactionMeData } = fetchMyReaction(commentId);

  const { data: reactionData } = fetchReaction(commentId);

  const likeCount = useMemo(() => {
    return reactionData?.data?.stat?.reaction?.like
      ? reactionData?.data?.stat?.reaction?.like
      : 0;
  }, [commentId, reactionData]);

  const liked = useMemo(() => {
    return reactionMeData?.data?.stat?.reaction?.like
      ? reactionMeData.data.stat.reaction.like > 0
      : false;
  }, [commentId, reactionMeData]);

  const childrenTotalCount = useMemo(() => {
    return childrenCommentsData?.pages &&
      childrenCommentsData?.pages.length > 0 &&
      childrenCommentsData?.pages[0]?.count?.total
      ? childrenCommentsData?.pages[0]?.count?.total
      : 0;
  }, [childrenCommentsData, commentId]);

  const handleClickShowMenu = useCallback(() => {
    setShowMenu(true);
  }, []);

  const handleClickHideMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleClickChildrenRead = useCallback(() => {
    setIsChildrenRead((prev) => !prev);
  }, []);

  const handleClickChildrenWrite = useCallback(() => {
    setIsChildrenWrite((prev) => !prev);
  }, [isChildrenRead]);

  const handleClickEdit = useCallback(() => {
    setShowMenu(false);
    setEdit(true);
  }, []);

  const handleClickLike = useCallback(async () => {
    await mutationPostReaction.mutateAsync({
      id: commentId,
      params: { origin_profile_id: targetProfileId, reaction: 'like' },
    });
  }, [targetProfileId, commentId]);

  const handleClickDelete = useCallback(async () => {
    await mutationDelComment.mutateAsync({
      id: commentId,
      data: {
        target_id: targetId,
        parent_id: parentId,
      },
    });
  }, [commentId, targetId, parentId]);

  const handleClickDeleteConfirm = useCallback(() => {
    setShowMenu(false);
    showConfirmPopup({
      titleText: t('GMY.000042'),
      onConfirm: handleClickDelete,
    });
  }, [handleClickDelete]);

  const handleClickEditCancel = useCallback(() => {
    setEdit(false);
  }, []);

  const handleAfterSubmit = useCallback(() => {
    setIsChildrenWrite(false);
    setIsChildrenRead(true);
  }, []);

  const showPreparingToast = useCallback(() => {
    showToastPopup({ titleText: '준비 중입니다.' });
  }, []);

  const actions = useMemo(() => {
    if (profileId === meProfileId) {
      const actions: ISelectButton[] = [
        {
          icon: 'Profile_M',
          textId: 'GMY.000038',
          onClick: showPreparingToast,
          defaultValue: '프로필 보기',
        },
        {
          icon: 'Edit_M',
          textId: 'GCM.000024',
          onClick: handleClickEdit,
          defaultValue: '수정',
        },
        {
          icon: 'Erase_M',
          textId: 'GCM.000025',
          onClick: handleClickDeleteConfirm,
          defaultValue: '삭제',
        },
      ];

      return actions;
    } else {
      const actions: ISelectButton[] = [
        {
          icon: 'Profile_M',
          textId: 'GMY.000038',
          onClick: showPreparingToast,
          defaultValue: '프로필 보기',
        },
      ];

      return actions;
    }
  }, [meProfileId, profileId, handleClickEdit, handleClickDeleteConfirm]);

  useEffect(() => {
    if (inView) {
      fetchChildrenCommentNextPage();
    }
  }, [inView]);

  return {
    childrenCommentsData,
    profileData,
    isProfileLoading,
    liked,
    likeCount,
    childrenTotalCount,
    showMenu,
    isEdit,
    isChildrenWrite,
    isChildrenRead,
    inViewRef,
    meProfileId,
    mentionData,
    actions,
    handleClickEditCancel,
    handleClickChildrenWrite,
    handleClickChildrenRead,
    handleClickHideMenu,
    handleClickShowMenu,
    fetchProfile,
    fetchComments,
    handleClickLike,
    handleAfterSubmit,
  };
};

export default useCommentItem;
