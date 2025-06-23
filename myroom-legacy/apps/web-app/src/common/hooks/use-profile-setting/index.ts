import i18n from 'i18next';
import useProfileAPI from '@/apis/User/Profile';
import { isFigureInfoVisibleAlwaysAtom } from '@/common/stores';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
export enum SETTING_ID {
  SHOW_FIGURE_INFO_ALWAYS = 'SHOW_FIGURE_INFO_ALWAYS',
  SHOW_FIGURE_INFO_TOUCH = 'SHOW_FIGURE_INFO_TOUCH',
  NOTIFICATION_ALL = 'NOTIFICATION_ALL',
  NOTIFICATION_COMMENT = 'NOTIFICATION_COMMENT',
  NOTIFICATION_BALLOON = 'NOTIFICATION_BALLOON',
  NOTIFICATION_FOLLOWER = 'NOTIFICATION_FOLLOWER',
  NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE',

  LANGUAGE = 'LANGUAGE',
}
export type UserSetting = {
  id: string;
  value: string | boolean;
};
const useProfileSetting = () => {
  const { fetchProfileMeSetting } = useProfileAPI();
  const { data: meProfileSetting } = fetchProfileMeSetting();
  const [isFigureInfoVisibleAlways, setIsFigureInfoVisibleAlways] = useAtom(
    isFigureInfoVisibleAlwaysAtom,
  );
  const [language, setLanguage] = useState('ko');
  useEffect(() => {
    if (!meProfileSetting) return;
    const setting = JSON.parse(meProfileSetting.data.option.ui ?? '');
    const userSettingList = setting as UserSetting[];
    setLanguage(meProfileSetting.data.option.lang ?? 'ko');
    i18n.changeLanguage(language);
    if (userSettingList) {
      const find = userSettingList.find(
        (_) => _.id === SETTING_ID.SHOW_FIGURE_INFO_ALWAYS,
      );
      if (find) {
        setIsFigureInfoVisibleAlways(find.value as boolean);
      }
    }
  }, [meProfileSetting]);
  return { language, isFigureInfoVisibleAlways };
};

export default useProfileSetting;
