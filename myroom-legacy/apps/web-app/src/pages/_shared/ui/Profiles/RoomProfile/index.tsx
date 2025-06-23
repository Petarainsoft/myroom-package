import React from 'react';
import Profile from '../Profile';
import Text from '@/components/Text';
import style from './style.module.scss';
import useRoom from '@/common/hooks/use-room';
import useProfileAPI from '@/apis/User/Profile';
import Skeleton from '@/components/Skeleton';
import { getProfileThumbnail } from '@/common/utils/profile';

const RoomProfile = () => {
  const { currentRoomInfo } = useRoom();
  const { fetchProfile } = useProfileAPI();

  const { data: profileData, isLoading: isProfileLoading } = fetchProfile(
    currentRoomInfo ? currentRoomInfo.ownerId : undefined,
  );

  return (
    <div className={style.roomProfileWrapper}>
      <Skeleton isLoading={isProfileLoading}>
        <Profile
          shape={'circle-br'}
          size="s"
          src={getProfileThumbnail(profileData)}
        />
        <div className={style.profileNameWrapper}>
          <Text text={profileData?.data?.option?.nick} />
        </div>
      </Skeleton>
    </div>
  );
};

export default RoomProfile;
