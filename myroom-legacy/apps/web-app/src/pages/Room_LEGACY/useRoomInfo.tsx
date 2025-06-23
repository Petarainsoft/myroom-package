import { useState, useEffect } from 'react';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import useProfileAPI from '@/apis/User/Profile';
import useMe from '@/common/hooks/use-me';
import { useMatchRoom } from '@/common/utils/common.hooks';
import { getProfileThumbnail } from '@/common/utils/profile';

const useRoomInfo = () => {
  const { fetchMyroom } = useMyRoomAPI();
  const { isHome, room_id, profileId } = useMatchRoom();
  const { meRoomId } = useMe();
  const { fetchProfile } = useProfileAPI();
  const [isMyroom, setIsMyroom] = useState<boolean | null>(null);
  const [currentMyroomId, setCurrentMyroomId] = useState<string | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  const { data: myroomData, isLoading: isLoadingMyroom } = fetchMyroom(
    currentMyroomId!,
  );

  const { data: profileData } = fetchProfile(currentProfileId ?? profileId!);
  const roomOwnerNickName = profileData?.data.option.nick;
  const roomOwnerId = profileData?.data._id;
  const roomOwnerThumnail = getProfileThumbnail(profileData);

  /**
   * [case1]: url room/room_id
   * 1. url에서 myroomId 추출 (home이면 나의myroom)
   * 2. myroomId로 profileId 알아냄
   * 3. profileId로 닉네임 알아냄
   *
   * [case2]: url profiles/profile_id
   * 1. url에서 profileId 추출
   */

  //profileId 알아내는 로직
  useEffect(() => {
    if (isLoadingMyroom) return;
    if (!myroomData) return;
    setCurrentProfileId(myroomData.data.profile_id);
  }, [isLoadingMyroom]);

  useEffect(() => {
    //home일때
    if (isHome) {
      setIsMyroom(true);
      setCurrentMyroomId(meRoomId!);
      //setIsOwnRoom(true);
      return;
    }
    //home도 아니고 roomId가 없을때
    if (!room_id) return;
    //roomId가 내 roomId와 같을때
    if (room_id == meRoomId) {
      setIsMyroom(true);
    } else {
      //setIsOwnRoom(false);
    }
    //currentRoomId 저장
    if (!currentMyroomId) {
      setCurrentMyroomId(room_id);
    }
  }, [isHome, room_id, meRoomId]);

  return {
    isMyroom,
    roomOwnerProfileId: currentProfileId ?? profileId,
    roomOwnerNickName,
    roomOwnerId,
    roomOwnerThumnail,
  };
};

export default useRoomInfo;
