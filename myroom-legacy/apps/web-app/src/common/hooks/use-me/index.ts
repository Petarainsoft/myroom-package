import { useCallback, useEffect, useMemo } from 'react';
import useAuth from '../use-auth';
import useProfileAPI from '@/apis/User/Profile';
import useUserAPI from '@/apis/User/User';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import { getProfileThumbnail } from '@/common/utils/profile';

type UserStatus = 'USER' | 'UNSIGNUP' | 'UNSIGNINED';

const useMe = () => {
  const { isLogined, signout } = useAuth();

  const { fetchProfile } = useProfileAPI();
  const { mutationUsersMeProfiles } = useUserAPI();
  const { fetchMyroomsMe } = useMyRoomAPI();

  const { data: meProfileData } = fetchProfile(isLogined ? 'me' : undefined);
  const { data: meRoomData } = fetchMyroomsMe();

  const meRoom = useMemo(() => {
    return meRoomData?.list && meRoomData?.list.length > 0
      ? meRoomData?.list[0]
      : undefined;
  }, [meRoomData]);

  const meProfileId = useMemo(() => {
    return meProfileData?.data?._id;
  }, [meProfileData]);

  const meAvatarId = useMemo(() => {
    return meProfileData?.data?.avatar_id;
  }, [meProfileData]);

  const meRoomId = useMemo(() => {
    return meProfileData?.data?.myroom_id;
  }, [meProfileData]);

  const meThumbnail = useMemo(() => {
    return getProfileThumbnail(meProfileData);
  }, [meProfileData]);

  const meName = useMemo(() => {
    return meProfileData?.data?.name;
  }, [meProfileData]);

  const meBackGroundColor = useMemo(() => {
    return meProfileData?.data?.option?.background_color;
  }, [meProfileData]);

  // 삭제 예정
  const checkSignup = useCallback(async (): Promise<UserStatus> => {
    if (isLogined) {
      if (meRoomId && meProfileId && meAvatarId) {
        return 'USER';
      }

      const res = await mutationUsersMeProfiles.mutateAsync({
        data: { limit: 1, page: 1 },
      });
      if (res?.list && res?.list.length > 0) {
        const user = res?.list[0];
        const id = user._id;
        const roomId = user.myroom_id;
        const avatarId = user.avatar_id;

        if (id && roomId && avatarId) {
          return 'USER';
        }
      }

      return 'UNSIGNUP';
    } else {
      signout();
      return 'UNSIGNINED';
    }
  }, [isLogined]);

  // 삭제 예정
  useEffect(() => {
    checkSignup();
  }, []);

  return {
    meName,
    meRoomId,
    meProfileId,
    meAvatarId,
    meThumbnail,
    meBackGroundColor,
    meRoom,
    checkSignup,
  };
};

export default useMe;
