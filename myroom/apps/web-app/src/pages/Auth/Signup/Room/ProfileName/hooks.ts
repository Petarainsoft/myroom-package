import React from 'react';
import { ChangeEvent, useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import useProfileAPI from '@/apis/User/Profile';
import { t } from 'i18next';
import {
  signup_isProfileNameInvalidAtom,
  signup_profileNameAtom,
} from '@/common/stores';
import { getByteLength } from '@/common/utils/string-format';
const MIN_BYTE_LENGTH = 4;
const MAX_BYTE_LENGTH = 20;

const useProfileName = () => {
  const { mutationProfilesAvailability } = useProfileAPI();

  const [profileName, setProfileName] = useAtom(signup_profileNameAtom);
  const setIsProfileNameInvalid = useSetAtom(signup_isProfileNameInvalidAtom);
  const [profileNameInvalidMsg, setProfileNameInvalidMsg] = useState('');

  useEffect(() => {
    setIsProfileNameInvalid(profileNameInvalidMsg != '');
  }, [profileNameInvalidMsg, setIsProfileNameInvalid]);

  const checkProfileNameWeb = React.useCallback(
    (profileName: string): string => {
      // eslint-disable-next-line
      const blank_pattern = /\s/;
      // eslint-disable-next-line
      const special_pattern = /[`~!@#$%^&*|\\\'\";:\/?]/gi;
      // eslint-disable-next-line
      const valid_pattern = /[^A-Za-z0-9]/gi;

      if (
        profileName.search(blank_pattern) > -1 ||
        special_pattern.test(profileName)
      )
        return t('GSU.000019'); // '공백이나 특수문자 입력이 불가합니다.';
      if (valid_pattern.test(profileName)) return t('GSU.000032'); // '영문, 숫자만 입력 가능합니다.'

      const byteLength = getByteLength(profileName);
      if (byteLength < MIN_BYTE_LENGTH || byteLength > MAX_BYTE_LENGTH)
        return t('GSU.000018'); // '4자 ~ 20자의 아이디를 지어주세요.';
      return '';
    },
    [],
  );

  const checkProfileNameServer = async (roomId: string) => {
    const res = await mutationProfilesAvailability.mutateAsync({
      name: roomId,
    });
    if (res) {
      // TODO : 코드에 맞는 textId로 바꿔야함.
      // GSU000017; // '이미 존재하는 아이디입니다.'
      // GSU000020; // '부적절한 아이디입니다.'
      if (res.error) {
        if (res.error == 25003)
          setProfileNameInvalidMsg(res.error_desc?.ko ?? t('GSU.000017'));
      }
      console.log(res);
    }
  };

  /**
   * id 변경 핸들러
   * @param e
   */
  const handleChangeProfileName = React.useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newProfileName = e.currentTarget.value;
      const errorMsg = checkProfileNameWeb(newProfileName);
      setProfileName(newProfileName);
      setProfileNameInvalidMsg(errorMsg);

      if (errorMsg == '') checkProfileNameServer(newProfileName);
    },
    [checkProfileNameServer],
  );

  return {
    profileName,
    profileNameInvalidMsg,
    handleChangeProfileName,
  };
};
export default useProfileName;
