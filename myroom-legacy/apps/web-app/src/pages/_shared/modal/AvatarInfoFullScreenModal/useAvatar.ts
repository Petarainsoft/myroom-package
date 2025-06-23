import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  currentCtgrAtom,
  currentCtgrKeyAtom,
  initialAvatarManifestAtom,
  myCurrentCtgrAtom,
  isAvatarSceneInitializedAtom,
  isMyStatusMessageAtom,
} from '@/common/stores';
import { logger } from '@/common/utils/logger';
import { avaCategory } from '@/common/utils/json/useCategory';
import { AvatarManager } from '@/common/factories/avatar';
import { useMatchRoom } from '@/common/utils/common.hooks';
import useCoordiAPI from '@/apis/Space/Avatar';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import useProfileAPI from '@/apis/User/Profile';
import useMe from '@/common/hooks/use-me';

const useAvatar = (avatarId: string, profileId: string) => {
  // 아바타 꾸미기 설정
  const setCurrentCtgr = useSetAtom(currentCtgrAtom); // 현재 적용 카테고리
  const setCurrentCtgrKey = useSetAtom(currentCtgrKeyAtom);
  const setMyCurrentCtgr = useSetAtom(myCurrentCtgrAtom);
  const setInitialAvatarManifest = useSetAtom(initialAvatarManifestAtom);

  const [avatarVersion, setAvatarVersion] = React.useState(0);
  const { fetchAvatar, fetchAvatarManifest } = useCoordiAPI();
  const { data: avatarData } = fetchAvatar(avatarId);
  const { data: avatarManifest, refetch: refetchAvatarManifest } =
    fetchAvatarManifest(avatarId, avatarVersion);

  // 아바타 상태메시지 설정
  const { fetchMyroom } = useMyRoomAPI();
  const { isHome, room_id } = useMatchRoom();
  const { meProfileId, meRoomId } = useMe();
  const { fetchProfile } = useProfileAPI();
  const [, setIsAvatarSceneInitialized] = useAtom(isAvatarSceneInitializedAtom);
  const [isMatchingRoomAvatar, setIsMatchingRoomAvatar] = React.useState<
    boolean | null
  >(null);
  const setIsMyStatusMessage = useSetAtom(isMyStatusMessageAtom);
  const { data: profileData } = fetchProfile(profileId);
  const nickName = profileData?.data.option.nick;
  const thumnail = profileData?.data?.resource?.avatar_selfie;

  const targetMyroomId = profileData?.data?.myroom_id;
  const { data: myroomData, isLoading: isLoadingMyroom } = fetchMyroom(
    isHome ? (meRoomId as string) : (room_id as string),
  );

  /** 상태메시지모달 통합 */
  // const setIsAvatarStatusSceneInitialized = useSetAtom(
  //   isAvatarStatusSceneInitializedAtom,
  // );

  //마이룸 profileID와 아바타 profileID비교 (isMatchingRoomAvatar)
  React.useEffect(() => {
    //home이면서 선택한 아바타 profileID가 내profileID 같은지
    if (isHome) {
      if (profileId == meProfileId || profileId == 'me') {
        setIsMatchingRoomAvatar(true);
        return;
      }
    }
    //도메인 rooms/로 시작할 때
    if (isLoadingMyroom || !myroomData) return;
    if (meRoomId === room_id && profileId === 'me') {
      setIsMatchingRoomAvatar(true);
      return;
    }
    setIsMatchingRoomAvatar(myroomData.data.profile_id === profileId);
  }, [isLoadingMyroom, room_id, meRoomId]);

  //나의 profileId와 선택한 아바타, 피규어의 ProfileId 비교(isMyStatusMessage)
  React.useEffect(() => {
    console.log('meProfileId', meProfileId, profileId);
    if (profileId === meProfileId || profileId === 'me') {
      setIsMyStatusMessage(true);
      return;
    }
    if (profileId !== meProfileId) {
      setIsMyStatusMessage(false);
      return;
    }
  }, [meProfileId]);

  React.useEffect(() => {
    if (!avatarData || !avatarId) return;
    if (avatarData.error) return;
    setAvatarVersion(avatarData.data.option.version);
  }, [avatarData]);

  React.useEffect(() => {
    if (avatarVersion === 0) return;
    refetchAvatarManifest();
  }, [avatarVersion]);

  // 아바타 씬 설정
  React.useEffect(() => {
    if (!avatarManifest) return;
    if (avatarManifest?.error) return;
    if (avatarVersion <= 0) return;
    setInitialAvatarManifest(avatarManifest);

    AvatarManager.onInit(() => {
      AvatarManager.getAPI.initializeAvatar(avatarId, avatarManifest);
      AvatarManager.getAPI.playAnimation(avatarManifest.main.animation, '_02');
    });
  }, [avatarManifest]);

  // 진입 시 아바타꾸미기 설정
  React.useEffect(() => {
    logger.log('AVA CATE ', avaCategory);
    setCurrentCtgr(avaCategory);
    setCurrentCtgrKey('11');
    setMyCurrentCtgr('');
    return () => setIsAvatarSceneInitialized(false);
  }, []);

  return {
    isMatchingRoomAvatar,
    targetMyroomId,
    nickName,
    thumnail,
  };
};

export default useAvatar;
