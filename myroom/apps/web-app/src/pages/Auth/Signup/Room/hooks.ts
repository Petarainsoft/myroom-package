import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { auth } from '@/common/utils/auth';
import useProfileAPI from '@/apis/User/Profile';
import useUserAPI from '@/apis/User/User';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import usePopup from '@/common/hooks/Popup/usePopup';
// import { refreshCredential } from '@colorverse/auth';
import useAuth from '@/common/hooks/use-auth';
import {
  signup_isProfileNameInvalidAtom,
  signup_profileNameAtom,
  signup_roomColorAtom,
  signup_roomTemplateItemDataAtom,
  uiOnBoardingAtom,
} from '@/common/stores';
import { AssetUtils } from 'client-core';
import { IAssetManifest_MyRoom } from 'client-core';
import useItemAPI from '@/apis/Meta/Item';
import { WORLD_ID } from '@/common/constants';
import { EItemCategory2 } from 'client-core';
import { IAssetManifest_Avatar } from 'client-core';
import useCoordiAPI from '@/apis/Space/Avatar';
import { logger } from '@/common/utils/logger';
import { DEFAULT_ACTION_ID } from '@/common/constants/avatar';
import useThumbnail from '@/common/hooks/use-thumbnail';
import useStatusMessageAPI from '@/apis/Social/StatusMessage';

type SignupCreateResult = {
  error?: string;
  data?: any;
};

const useSignupRoom = () => {
  const navigate = useNavigate();
  const { showAPIErrorPopup } = usePopup();
  const { signin } = useAuth();
  const { mutationPostProfiles, mutationPostProfile } = useProfileAPI();
  const { mutationPostMyrooms, mutationPatchMyroom } = useMyRoomAPI();
  const { mutationPostAvatars } = useCoordiAPI();
  const { data: profileData } = useUserAPI().fetchUsersMeProfiles(1, 1);

  const avatarItemList = useItemAPI().fetchItems({
    w: WORLD_ID,
    category: EItemCategory2.SYSTEMAVATAR.toString(),
  }).data?.list;

  // 생성하다가 어디서 걸릴지 모르니 생성 했던 것들 저장.
  const [createdProfileName, setCreatedProfileName] = useState('');
  const [createdAvatarId, setCreatedAvatarId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [, setCreatedAvatarThumbnail] = useState('');

  const profileName = useAtomValue(signup_profileNameAtom);
  const isProfileNameInvalid = useAtomValue(signup_isProfileNameInvalidAtom);

  const roomTemplateItemData = useAtomValue(signup_roomTemplateItemDataAtom);
  const roomColor = useAtomValue(signup_roomColorAtom);
  const setUIOnBoarding = useSetAtom(uiOnBoardingAtom);

  //초기 상태메시지 등록
  const { mutationPostStatusMessage } = useStatusMessageAPI();
  const { urlToThumbnail } = useThumbnail();

  useEffect(() => {
    if (profileData?.list && profileData?.list.length > 0) {
      logger.log('profileData : ', profileData.list[0]);
      setCreatedProfileName(profileData.list[0].name);
      setCreatedAvatarId(profileData.list[0].avatar_id);
      setCreatedRoomId(profileData.list[0].myroom_id);
    }
  }, [profileData]);

  const createStatusMessage = React.useCallback(
    async (thumbnail: string) => {
      const res = await mutationPostStatusMessage.mutateAsync({
        data: {
          option: {
            comments_enable: true,
            comments_input_scope: 'all',
            fixed: false,
            language: 'ko',
            show: true,
          },
          resource: {
            action: [DEFAULT_ACTION_ID],
            image: [thumbnail],
          },
          txt: {
            contents: '',
            hashtag: [],
            title: null,
          },
        },
      });

      return res;
    },
    [mutationPostStatusMessage],
  );

  // 프로필 생성 ---------------------------------------------------------------//
  const createProfile =
    React.useCallback(async (): Promise<SignupCreateResult> => {
      if (createdProfileName != '') {
        return {};
      }

      const res = await mutationPostProfiles.mutateAsync({
        data: {
          name: profileName,
          option: {
            interest: [1],
            background_color: roomColor,
            nick: profileName,
          },
        },
      });
      if (!res || res.error) {
        return {
          error:
            (res?.error_desc as any as string) ??
            res?.error?.toString() ??
            'API ERROR',
        };
      }
      setCreatedProfileName(profileName);
      signin();
      // await refreshCredential(auth);

      return {
        data: {
          id: res.data._id,
        },
      };
    }, [
      createdProfileName,
      mutationPostProfiles,
      profileName,
      roomColor,
      signin,
    ]);

  //- 프로필 업데이트
  const updateProfile = React.useCallback(
    async (
      profileId: string,
      thumbnail: string,
    ): Promise<SignupCreateResult> => {
      await mutationPostProfile.mutateAsync({
        profileId: profileId,
        data: {
          resource: {
            avatar_selfie: thumbnail,
          },
        },
      });

      return {};
    },
    [mutationPostProfile],
  );

  // 룸 생성 --------------------------------------------------------------------//
  const createMyRoom = React.useCallback(
    async (avatarId: string): Promise<SignupCreateResult> => {
      if (!roomTemplateItemData) {
        return { error: 'Room Template Item Data가 없음.' };
      }

      const roomManifest =
        await AssetUtils.readJsonFromUrl<IAssetManifest_MyRoom>(
          roomTemplateItemData.resource.manifest,
        );
      if (!roomManifest) {
        return { error: 'room preset manifestJson를 불러오는데 실패함.' };
      }

      roomManifest.main.room.backgroundColor = roomColor;
      if (!roomManifest.main.figures) roomManifest.main.figures = [];
      roomManifest.main.figures.push({
        avatarId: avatarId,
        isAvatar: true,
        placeInfo: roomManifest.main.defaultAvatarPos,
        parentId: '',
      });

      let thumbnail;
      if (roomTemplateItemData.resource.thumbnail) {
        const _thumbnail = await urlToThumbnail(
          roomTemplateItemData.resource.thumbnail,
        );
        thumbnail = _thumbnail ?? '';
      }

      const roomData = {
        txt: {
          title: profileName,
        },
        manifest: JSON.parse(JSON.stringify(roomManifest)),
        resource: {
          thumbnail: thumbnail,
        },
        option: {
          preset: roomTemplateItemData._id,
        },
      };

      // 이미 생성되어있는 room이 있다. patch 한다.

      if (createdRoomId) {
        const res = await mutationPatchMyroom.mutateAsync({
          id: createdRoomId,
          data: roomData,
        });
        if (!res || res.error) {
          return {
            error:
              (res?.error_desc as any as string) ?? res?.error ?? 'API ERROR',
          };
        }
      } else {
        // room 생성.
        const res = await mutationPostMyrooms.mutateAsync({
          data: roomData,
        });
        if (!res || res.error) {
          return {
            error:
              (res?.error_desc as any as string) ?? res?.error ?? 'API ERROR',
          };
        }
      }
      return {};
    },
    [
      roomTemplateItemData,
      roomColor,
      profileName,
      createdRoomId,
      urlToThumbnail,
      mutationPatchMyroom,
      mutationPostMyrooms,
    ],
  );

  // 아바타 생성 -----------------------------------------------------------------//
  const createAvatar =
    React.useCallback(async (): Promise<SignupCreateResult> => {
      if (createdAvatarId != '') {
        return { data: createdAvatarId };
      }

      if (avatarItemList == null) {
        return { error: '서버에서 받은 아바타 목록이 없음.' };
      }

      const avatarItem =
        avatarItemList[Math.floor(Math.random() * avatarItemList.length)];
      const avatarManifest =
        await AssetUtils.readJsonFromUrl<IAssetManifest_Avatar>(
          avatarItem.resource.manifest,
        );

      if (!avatarManifest) {
        return { error: 'avatar manifest를 불러오는데 실패함.' };
      }

      const avatarData = {
        manifest: JSON.parse(JSON.stringify(avatarManifest)),
      };

      const res = await mutationPostAvatars.mutateAsync({ data: avatarData });
      if (!res || res.error) {
        return {
          error:
            (res?.error_desc as any as string) ?? res?.error ?? 'API ERROR',
        };
      }

      setCreatedAvatarId(res.data._id);

      let thumbnail;
      if (avatarItem.resource.thumbnail) {
        thumbnail = await urlToThumbnail(avatarItem.resource.thumbnail);
        if (thumbnail) {
          setCreatedAvatarThumbnail(thumbnail);
        }
      }

      return {
        data: {
          id: res.data._id,
          thumbnail: thumbnail,
        },
      };
    }, [createdAvatarId, avatarItemList, mutationPostAvatars, urlToThumbnail]);

  const handleClickCreateRoom = React.useCallback(async () => {
    // 프로필을 생성합니다.
    const createProfileResult = await createProfile();
    if (createProfileResult.error) {
      showAPIErrorPopup({
        titleTextId: 'GSU.000030',
        errorText: createProfileResult.error.toString(),
      });
      return;
    }

    const createAvatarResult = await createAvatar();
    if (createAvatarResult.error) {
      showAPIErrorPopup({
        titleTextId: 'GSU.000033',
        errorText: createAvatarResult.error.toString(),
      });
      return;
    }

    // 아바타에 프로필 이미지를 넣어줍니다.
    const updateProfileResult = await updateProfile(
      createProfileResult.data.id,
      createAvatarResult.data.thumbnail,
    );
    if (updateProfileResult.error) {
      showAPIErrorPopup({
        titleTextId: 'GSU.000033',
        errorText: updateProfileResult.error.toString(),
      });
      return;
    }

    const createStatusMessageResult = await createStatusMessage(
      createAvatarResult.data.thumbnail,
    );
    if (createStatusMessageResult.error) {
      showAPIErrorPopup({
        titleTextId: 'GSU.000030',
        errorText: createProfileResult.error?.toString(),
      });
      return;
    }

    // room 생성 할 때 avatarid가 필요해서..
    const createRoomResult = await createMyRoom(createAvatarResult.data.id);
    if (createRoomResult.error) {
      showAPIErrorPopup({
        titleTextId: 'GSU.000031',
        errorText: createRoomResult.error.toString(),
      });
      return;
    }
    setUIOnBoarding(true);
    navigate('/rooms/me');
  }, [
    createAvatar,
    createMyRoom,
    createProfile,
    createStatusMessage,
    navigate,
    setUIOnBoarding,
    updateProfile,
  ]);

  const handleClickBack = useCallback(() => {
    navigate(-1);
  }, []);

  return {
    profileName,
    createdProfileName,
    isProfileNameInvalid,
    roomColor,
    handleClickCreateRoom,
    handleClickBack,
  };
};
export default useSignupRoom;
