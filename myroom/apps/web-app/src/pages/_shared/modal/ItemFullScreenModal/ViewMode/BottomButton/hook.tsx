import { useEffect, useState } from 'react';
import useReactionAPI from '@/apis/Social/Reaction';
import useItemAPI from '@/apis/Meta/Item';

const useItemScrap = (itemId: string) => {
  const { mutationItem } = useItemAPI();
  const { fetchMyReaction, fetchReaction, mutationPostReaction } =
    useReactionAPI();
  const [isFav, setIsFav] = useState<boolean | null>(null);
  const [itemProfileId, setItemProfileId] = useState('');
  const [scrapNum, setScrapNum] = useState(0);

  const getItem = async () => {
    const res = await mutationItem.mutateAsync({
      itemId,
    });
    if (res?.data) setItemProfileId(res.data.profile_id);
  };

  const { data: reactionData, isLoading: isLoadingReaction } =
    fetchReaction(itemId);

  const updateReaction = (data: any) => {
    setScrapNum(data.data.stat.reaction.like);
  };

  const { data: favData, isLoading: isLoadingFavData } =
    fetchMyReaction(itemId);

  const getIsFav = () => {
    if (favData?.data && favData?.data.stat.reaction.like === 1) {
      setIsFav(true);
    } else setIsFav(false);
  };

  const handleScrap = () => {
    mutationPostReaction.mutate({
      id: itemId,
      params: {
        origin_profile_id: itemProfileId,
        reaction: 'like',
      },
    });
  };

  //아이템 스크랩 여부
  useEffect(() => {
    if (!favData) return;
    if (isLoadingFavData) return;
    getIsFav();
  }, [favData, isLoadingFavData]);

  //아이템 정보
  useEffect(() => {
    getItem();
  }, []);

  //리액션 개수 업데이트
  useEffect(() => {
    if (!reactionData) return;
    if (isLoadingReaction) return;
    updateReaction(reactionData);
  }, [reactionData, isLoadingReaction]);

  return {
    isFav,
    itemProfileId,
    isLoadingFavData,
    isLoadingReaction,
    scrapNum,
    handleScrap,
  };
};

export default useItemScrap;
