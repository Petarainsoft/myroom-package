import useFollowAPI from '.';

const useFollow = () => {
  const { mutationPutFollowings, mutationDelFollowings } = useFollowAPI();

  //팔로우 요청
  const handleRequestFollow = async ({
    profileId,
    isFollow,
  }: {
    profileId: string;
    isFollow: boolean;
  }): Promise<boolean> => {
    if (isFollow) {
      await mutationDelFollowings.mutateAsync({ profileId });
      return false;
    } else {
      await mutationPutFollowings.mutateAsync({ profileId });
      return true;
    }
  };

  return { handleRequestFollow };
};

export default useFollow;
