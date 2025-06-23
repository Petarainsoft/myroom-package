import { BalloonData } from '@/apis/Social/Balloons/type';
import useProfileAPI from '@/apis/User/Profile';
import useBalloonProduct from './useBalloonProduct';
import { getProfileThumbnail } from '@/common/utils/profile';

const useBalloonData = (balloonData: BalloonData) => {
  const { balloonThumbnail } = useBalloonProduct(balloonData.balloon_item_id);
  const { data: profileRes } = useProfileAPI().fetchProfile(
    balloonData.writer_profile_id,
  );

  const writerSelfie = getProfileThumbnail(profileRes);
  const writerNickname = profileRes?.data.option.nick;
  const writerMyRoomId = profileRes?.data.myroom_id;

  return { writerSelfie, writerNickname, writerMyRoomId, balloonThumbnail };
};
export default useBalloonData;
