import useItemAPI from '@/apis/Meta/Item';

const useBalloonProduct = (balloonId: string) => {
  const { data: balloonItemData } = useItemAPI().fetchItem(balloonId);
  const balloonThumbnail = balloonItemData?.data?.resource?.thumbnail ?? '';
  const balloonResource =
    balloonThumbnail?.replace('thumbnail', 'resource') ?? '';
  return { balloonThumbnail, balloonResource };
};
export default useBalloonProduct;
