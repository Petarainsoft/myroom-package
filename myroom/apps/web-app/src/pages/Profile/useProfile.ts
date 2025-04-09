import React, { useState } from 'react';
import { logger } from '@/common/utils/logger';
import useProfileAPI from '@/apis/User/Profile';
import useMyRoomAPI from '@/apis/Space/MyRoom';

interface IUseProfile {
  profileId: string;
  isMine: boolean;
}

const useProfile = ({ profileId, isMine }: IUseProfile) => {
  const [myRoomId, setMyRoomId] = React.useState<string | undefined>('');
  const [thumbnailPath, setThumbnailPath] = React.useState<string | undefined>(
    '',
  );
  const [isImageSelfie, setIsImageSelfie] = React.useState<boolean | undefined>(
    undefined,
  );
  const [avatarSelfie, setAvatarSelfie] = React.useState<string>('');
  const [imageSelfie, setImageSelfie] = React.useState<string>('');
  const [nickName, setNickname] = React.useState<string | undefined>('');
  const [userName, setUserName] = React.useState<string | undefined>('');
  const [userDesc, setUserDesc] = React.useState<string | undefined>('');
  const [followingCount, setFollowingCount] = React.useState<
    number | undefined
  >(0);
  const [followerCount, setFollowerCount] = React.useState<number | undefined>(
    0,
  );

  const { fetchProfilesMeCount, fetchProfileCount, fetchProfile } =
    useProfileAPI();
  const { data: profileData, refetch: refetchProfile } =
    fetchProfile(profileId);
  const { data: profileMeCnt, refetch: refetchProfileMeCount } = isMine
    ? fetchProfilesMeCount()
    : { data: undefined, refetch: null };
  const { data: profileCnt, refetch: refetchProfileCount } = !isMine
    ? fetchProfileCount(profileId)
    : { data: undefined, refetch: null };
  const { fetchMyroom, fetchMyroomManifest } = useMyRoomAPI();

  const { data: roomData, refetch: refetchMyroom } = fetchMyroom(
    profileData?.data.myroom_id,
  );
  const { data: roomManifest } = fetchMyroomManifest(
    profileData?.data.myroom_id ?? '',
    roomData?.data.option.version,
  );

  const [roomThumbnail, setRoomThumbnail] = useState<string | undefined>('');
  const [roomColor, setRoomColor] = useState<string | undefined>('');
  const [roomTitle, setRoomTitle] = useState<string | undefined>('');
  const avatarId = profileData?.data.avatar_id;
  const refetchProfileAPIs = React.useCallback(() => {
    refetchProfile?.();
    refetchProfileCount?.();
    refetchProfileMeCount?.();
  }, [refetchProfile, refetchProfileCount, refetchProfileMeCount]);
  const refetchMyroomAPIs = React.useCallback(() => {
    refetchMyroom?.();
  }, [refetchMyroom]);
  React.useEffect(() => {
    if (!profileData || profileData.error) return;
    logger.log('useProfile profileData', profileData);
    setNickname(profileData.data.option.nick);
    setUserName(profileData.data.name);

    const isImageSelfie = profileData.data.option.selfie_type === 'image';
    setIsImageSelfie(isImageSelfie);
    setThumbnailPath(
      isImageSelfie
        ? profileData.data.resource.image_selfie
        : profileData.data.resource.avatar_selfie,
    );
    setAvatarSelfie(profileData.data.resource.avatar_selfie);
    setImageSelfie(profileData.data.resource.image_selfie);
    setMyRoomId(profileData.data.myroom_id);
    setUserDesc(profileData.data.txt?.desc ?? ''); // Todo: 테스트 끝나면 원상복귀
    // setUserDesc('serve similar purposes, but they execute at different points in the rendering cycle. Neither is inherently "faster" than the other, but they have different timings which can impact performance and user experience in certain scenarios.');
  }, [profileData]);
  React.useEffect(() => {
    if (!roomData) return;
    logger.log('userProfile roomData : ', roomData);
    setRoomThumbnail(roomData.data.resource.thumbnail);
    setRoomTitle(roomData.data.txt.title);
  }, [roomData]);
  React.useEffect(() => {
    if (!roomManifest) return;
    setRoomColor(roomManifest.main?.room?.backgroundColor);
  }, [roomManifest]);
  React.useEffect(() => {
    logger.log('profileMeCnt ', profileMeCnt);
    if (!profileMeCnt || profileMeCnt.error) return;
    setFollowingCount(profileMeCnt.data.following);
    setFollowerCount(profileMeCnt.data.follower);
  }, [profileMeCnt]);

  React.useEffect(() => {
    logger.log('profileCnt 1');
    if (!profileCnt || profileCnt.error) return;
    logger.log('profileCnt 2', profileCnt);
    setFollowingCount(profileCnt.data.following);
    setFollowerCount(profileCnt.data.follower);
  }, [profileId, profileCnt, profileMeCnt]);

  return {
    myRoomId,
    thumbnailPath,
    isImageSelfie,
    avatarSelfie,
    imageSelfie,
    nickName,
    userName,
    userDesc,
    followingCount,
    followerCount,
    roomThumbnail,
    roomColor,
    roomTitle,
    avatarId,
    refetchProfileAPIs,
    refetchMyroomAPIs,
  };
};

export default useProfile;
