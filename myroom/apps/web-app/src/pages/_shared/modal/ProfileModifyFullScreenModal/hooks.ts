import useResourceAPI from '@/apis/Resource';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import useProfileAPI from '@/apis/User/Profile';
import { ProfileData } from '@/apis/User/Profile/type';
import useModal from '@/common/hooks/Modal/useModal';
import usePopup from '@/common/hooks/Popup/usePopup';
import useProfile from '@/pages/Profile/useProfile';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  getByteLength,
  truncateToByteLength,
} from '@/common/utils/string-format';
const MAX_NICKNAME_BYTE_LENGTH = 30;
const MAX_DESC_BYTE_LENGTH = 150;
const MAX_MYROOM_NAME_LENGTH = 30;
const useProfileModifyFullScreenModal = (profileId: string) => {
  const { mutationPatchMyroom } = useMyRoomAPI();
  const { mutationPostProfile } = useProfileAPI();
  const { mutationPostResourceImage } = useResourceAPI();
  const {
    thumbnailPath,
    isImageSelfie: originIsImageSelfie,
    avatarSelfie: originAvatarSelfie,
    imageSelfie: originImageSelfie,
    nickName: originNickname,
    userName,
    userDesc: originDesc,
    roomTitle: originRoomTitle,
    myRoomId,
    refetchProfileAPIs,
    refetchMyroomAPIs,
  } = useProfile({ profileId: profileId, isMine: true });

  const [nickname, setNickname] = useState<string>('');
  const [userDesc, setUserDesc] = useState<string>('');
  const [myRoomTitle, setMyRoomTitle] = useState<string>('');
  const [isImageSelfie, setIsImageSelfie] = useState<boolean | undefined>(
    undefined,
  );
  const [selfiePath, setSelfiePath] = useState<string>('');
  const [imageSelfieFile, setImageSelfieFile] = useState<File | null>(null);

  const [isNicknameChanged, setIsNicknameChanged] = useState<boolean>(false);
  const [isUserDescChanged, setIsUserDescChanged] = useState<boolean>(false);
  const [isMyRoomTitleChanged, setIsMyRoomTitleChanged] =
    useState<boolean>(false);
  const [isSelfieChanged, setIsSelfieChanged] = useState<boolean>(false);

  const [canSave, setCanSave] = useState<boolean>(false);

  const MAX_SIZE = 10;
  const { showToastPopup, showAPIErrorPopup } = usePopup();
  const ImageCropEditModal = useModal('ImageCropEditModal');
  const nicknameFieldRef = useRef<HTMLInputElement>(null);
  const myRoomTitleFieldRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // nickname, myroomName 등 초기화.
  useEffect(() => {
    setNickname(originNickname ?? '');
    setUserDesc(originDesc ?? '');
    setMyRoomTitle(originRoomTitle ?? '');
    setIsImageSelfie(originIsImageSelfie);
    setSelfiePath(thumbnailPath ?? '');
    if (selfieInputRef.current) selfieInputRef.current.value = '';
    setImageSelfieFile(null);
    setCanSave(false);
  }, [
    originNickname,
    originDesc,
    originRoomTitle,
    thumbnailPath,
    originIsImageSelfie,
    setNickname,
    setUserDesc,
    setMyRoomTitle,
    setIsImageSelfie,
    setImageSelfieFile,
    setSelfiePath,
    selfieInputRef,
  ]);

  useEffect(() => {
    setIsNicknameChanged(nickname !== '' && nickname !== originNickname);
  }, [nickname, originNickname]);
  useEffect(() => {
    setIsMyRoomTitleChanged(
      myRoomTitle != '' && myRoomTitle !== originRoomTitle,
    );
  }, [myRoomTitle, originRoomTitle]);
  useEffect(() => {
    setIsUserDescChanged(userDesc !== originDesc);
  }, [userDesc, originDesc]);
  useEffect(() => {
    if (originIsImageSelfie === undefined || isImageSelfie === undefined)
      return;
    if (originIsImageSelfie === isImageSelfie) {
      // 사진인데 imageSelfieFile 의 값이 있다 === 사진을 한번 바꿨다.
      // 아바타 타입인 경우 바뀔 일이 없음.
      if (isImageSelfie && imageSelfieFile) {
        setIsSelfieChanged(true);
        return;
      }
    } else {
      setIsSelfieChanged(true);
    }
  }, [
    originAvatarSelfie,
    originImageSelfie,
    selfiePath,
    originIsImageSelfie,
    isImageSelfie,
    imageSelfieFile,
  ]);

  useEffect(() => {
    setCanSave(
      isNicknameChanged ||
        isMyRoomTitleChanged ||
        isUserDescChanged ||
        isSelfieChanged,
    );
  }, [
    isNicknameChanged,
    isMyRoomTitleChanged,
    isUserDescChanged,
    isSelfieChanged,
  ]);
  const checkMaxByteLength = (text: string, max: number) => {
    const length = getByteLength(text);
    if (max < length) {
      showToastPopup({
        titleText: '최대 입력 가능한 글자 수를 초과하였습니다.',
      });
      return false;
    }
    return true;
  };
  const handleOnChangeNicknameField = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget) return;
      if (
        !checkMaxByteLength(e.currentTarget.value, MAX_NICKNAME_BYTE_LENGTH)
      ) {
        setNickname(
          truncateToByteLength(e.currentTarget.value, MAX_NICKNAME_BYTE_LENGTH),
        );
        return;
      }
      setNickname(e.currentTarget.value);
    },
    [setNickname],
  );

  const handleOnChangeMyRoomTitleField = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.currentTarget) return;
      if (!checkMaxByteLength(e.currentTarget.value, MAX_MYROOM_NAME_LENGTH)) {
        setMyRoomTitle(
          truncateToByteLength(e.currentTarget.value, MAX_MYROOM_NAME_LENGTH),
        );
        return;
      }
      setMyRoomTitle(e.currentTarget.value);
    },
    [setMyRoomTitle],
  );

  const handleOnChangeUserDescField = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (!e.currentTarget) return;
      if (!checkMaxByteLength(e.currentTarget.value, MAX_DESC_BYTE_LENGTH)) {
        setUserDesc(
          truncateToByteLength(e.currentTarget.value, MAX_DESC_BYTE_LENGTH),
        );
        return;
      }
      setUserDesc(e.currentTarget.value);
    },
    [setUserDesc],
  );

  const handleClearNicknameField = useCallback(() => {
    setNickname('');
    nicknameFieldRef.current?.focus();
  }, [setNickname]);
  const handleClearMyRoomTitleField = useCallback(() => {
    setMyRoomTitle('');
  }, [setMyRoomTitle]);

  const handleSelectAvatarSelfie = useCallback(() => {
    setIsImageSelfie(false);
    setSelfiePath(originAvatarSelfie);
  }, [originAvatarSelfie]);
  const handleSelectImageSelfieFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (!e.target || !e.target.files) return;
      const file = e.target.files[0];
      const fileSize = file.size; // 파일 크기(Byte)
      // const fileType = file.type;
      const sizeInMB = Number((fileSize / (1024 * 1024)).toFixed(2));
      if (sizeInMB > MAX_SIZE) {
        showToastPopup({ titleText: '10mb 이하의 파일만 업로드 가능합니다' });
      }
      ImageCropEditModal.createModal({
        file,
        onComplete: (file: File) => {
          setImageSelfieFile(file);
          setIsImageSelfie(true);
          const fr = new FileReader();
          fr.onload = (e) => {
            if (e.target) setSelfiePath(e.target.result as string);
          };
          fr.readAsDataURL(file);
          console.log(file);
        },
      });
    },
    [],
  );
  const handleCopyText = (text: string) => {
    console.log('handleCopyText - ', text);
  };
  const handleSubmit = useCallback(async () => {
    if (isNicknameChanged || isUserDescChanged || isSelfieChanged) {
      const profileData: ProfileData = {};

      if (isNicknameChanged) {
        if (!profileData.option) profileData.option = {};
        profileData.option.nick = nickname;
      }
      if (isUserDescChanged) {
        profileData.txt = { desc: userDesc };
      }

      if (isImageSelfie && imageSelfieFile) {
        const res = await mutationPostResourceImage.mutateAsync({
          data: { images: imageSelfieFile },
          params: {},
        });
        if (res && res.list && res.list.length > 0) {
          if (!profileData.resource) profileData.resource = {};
          profileData.resource.image_selfie = res.list[0]._id;
          if (!profileData.option) profileData.option = {};
          profileData.option.selfie_type = 'image';
        }
        if (!res || res.error) {
          showAPIErrorPopup({
            titleText: `프로필 수정 실패.\n(${
              res?.error_desc ?? res?.error ?? 'API ERROR'
            })`,
          });
          return;
        }
      } else if (originIsImageSelfie !== isImageSelfie) {
        if (!profileData.option) profileData.option = {};
        profileData.option.selfie_type = isImageSelfie ? 'image' : 'avatar';
      }
      const res = await mutationPostProfile.mutateAsync({
        profileId: profileId,
        data: profileData,
      });
      console.log('handleSubmit post profile. - ', res);

      if (!res || res.error) {
        showAPIErrorPopup({
          titleText: `프로필 수정 실패.\n(${
            res?.error_desc ?? res?.error ?? 'API ERROR'
          })`,
        });
        return;
      }
      refetchProfileAPIs();
    }

    if (isMyRoomTitleChanged && myRoomId) {
      const res = await mutationPatchMyroom.mutateAsync({
        id: myRoomId,
        data: {
          txt: {
            title: myRoomTitle,
          },
        },
      });
      console.log('handleSubmit myroom patch', res);
      if (!res || res.error) {
        showAPIErrorPopup({
          titleText: `프로필 수정 실패.\n(${
            res?.error_desc ?? res?.error ?? 'API ERROR'
          })`,
        });
        return;
      }
      refetchMyroomAPIs();
    }
  }, [
    isNicknameChanged,
    isUserDescChanged,
    isMyRoomTitleChanged,
    isSelfieChanged,
    nickname,
    userDesc,
    myRoomTitle,
    isImageSelfie,
    imageSelfieFile,
  ]);

  return {
    selfiePath,
    isImageSelfie,
    nickname,
    userName,
    userDesc,
    myRoomTitle,
    canSave,
    nicknameFieldRef,
    myRoomTitleFieldRef,
    selfieInputRef,
    handleSelectAvatarSelfie,
    handleSelectImageSelfieFile,
    handleClearNicknameField,
    handleClearMyRoomTitleField,
    handleOnChangeNicknameField,
    handleOnChangeMyRoomTitleField,
    handleOnChangeUserDescField,
    handleCopyText,
    handleSubmit,
  };
};
export default useProfileModifyFullScreenModal;
