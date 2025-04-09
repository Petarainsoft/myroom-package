import useProfileAPI from '@/apis/User/Profile';
import { useCallback, useEffect, useState } from 'react';
import { SettingData } from '../SettingListFullScreenModal';
import useModal from '@/common/hooks/Modal/useModal';
import { ProfileSettingData } from '@/apis/User/Profile/type';
import { useNavigate } from 'react-router-dom';

import { SETTING_ID, UserSetting } from '@/common/hooks/use-profile-setting';
import i18n from 'i18next';
import useAppAPI from '@/apis/World/App';
import usePopup from '@/common/hooks/Popup/usePopup';
const ShowFigureInfoSettings: SettingData[] = [
  {
    groupId: 'showFigureInfo',
    id: SETTING_ID.SHOW_FIGURE_INFO_TOUCH,
    title: '터치 시',
    desc: '피규어와 아이템을 터치 했을 때에만 마이룸에 표시됩니다.',
    type: 'checkbox',
  },
  {
    groupId: 'showFigureInfo',
    id: SETTING_ID.SHOW_FIGURE_INFO_ALWAYS,
    title: '항시',
    desc: '피규어와 아이템 정보가 마이룸에 항시 표시됩니다.',
    type: 'checkbox',
  },
];
const NotificationSettings: SettingData[] = [
  {
    groupId: 'notification',
    id: SETTING_ID.NOTIFICATION_ALL,
    title: '알림 수신',
    desc: '알림을 끌 경우 모든 알림이 오지 않습니다.',
    type: 'toggle' ?? false,
  },
  {
    groupId: 'notification',
    id: SETTING_ID.NOTIFICATION_COMMENT,
    title: '댓글/대댓글 알림',
    desc: '내 글에 댓글이 등록되거나 내 댓글에 답글이 등록되면 알려드립니다.',
    type: 'toggle',
    parentId: SETTING_ID.NOTIFICATION_ALL,
  },
  {
    groupId: 'notification',
    id: SETTING_ID.NOTIFICATION_BALLOON,
    title: '신규 풍선 알림',
    desc: '내 마이룸에 새로운 풍선이 날려지면 알려드립니다.',
    type: 'toggle',
    parentId: SETTING_ID.NOTIFICATION_ALL,
  },
  {
    groupId: 'notification',
    id: SETTING_ID.NOTIFICATION_FOLLOWER,
    title: '팔로워 알림',
    desc: '나를 팔로우 하는 사용자가 있으면 알려드립니다.',
    type: 'toggle',
    parentId: SETTING_ID.NOTIFICATION_ALL,
  },
  {
    groupId: 'notification',
    id: SETTING_ID.NOTIFICATION_SERVICE,
    title: '서비스 소식',
    desc: '다양한 이벤트 혜택 및 공지사항 등의 서비스 소식을 알려드립니다.',
    type: 'toggle',
    parentId: SETTING_ID.NOTIFICATION_ALL,
  },
];
const LanguageSettings: SettingData[] = [
  {
    groupId: 'language',
    id: SETTING_ID.LANGUAGE,
    title: 'English',
    type: 'checkbox',
    value: 'en',
  },
  {
    groupId: 'language',
    id: SETTING_ID.LANGUAGE,
    title: '한국어',
    type: 'checkbox',
    value: 'ko',
  },
];
const SettingIdToTextID = (settingId: string) => {
  switch (settingId) {
    case SETTING_ID.SHOW_FIGURE_INFO_ALWAYS:
      return '항상';
    case SETTING_ID.SHOW_FIGURE_INFO_TOUCH:
      return '터치 시';
    case SETTING_ID.NOTIFICATION_ALL:
    case SETTING_ID.NOTIFICATION_COMMENT:
    case SETTING_ID.NOTIFICATION_BALLOON:
    case SETTING_ID.NOTIFICATION_FOLLOWER:
    case SETTING_ID.NOTIFICATION_SERVICE:
      return 'ON';
  }
  return '';
};
const LanguageCodeToSettingValue = (code: string) => {
  if (code.toLowerCase().includes('ko')) return 'ko';
  return 'en';
};
const LanguageSettingValueToString = (value: string) => {
  if (value.toLowerCase() === 'ko') return '한국어';
  return 'English';
};

const useProfileAccountSettingFullScreenModal = (
  onRequestClose: () => void,
) => {
  const navigate = useNavigate();
  const { fetchProfileMeSetting, mutationPostProfileMeSetting } =
    useProfileAPI();
  const { data: settingRes } = fetchProfileMeSetting();
  const SettingListFullScreenModal = useModal('SettingListFullScreenModal');
  const TextFullScreenModal = useModal('TextFullScreenModal');
  const SessionListFullScreenModal = useModal('SessionListFullScreenModal');
  const WithdrawFullScreenModal = useModal('WithdrawFullScreenModal');
  const termsRes = useAppAPI().fetchApp('').data?.data.option.term;
  const {showToastPopup, showConfirmPopup} = usePopup();
  const [userSettingList, setUserSettingList] = useState<UserSetting[]>([
    { id: SETTING_ID.SHOW_FIGURE_INFO_ALWAYS, value: true },
    { id: SETTING_ID.SHOW_FIGURE_INFO_TOUCH, value: false },
    { id: SETTING_ID.NOTIFICATION_ALL, value: true },
    { id: SETTING_ID.NOTIFICATION_COMMENT, value: true },
    { id: SETTING_ID.NOTIFICATION_BALLOON, value: true },
    { id: SETTING_ID.NOTIFICATION_FOLLOWER, value: true },
    { id: SETTING_ID.NOTIFICATION_SERVICE, value: true },
    { id: SETTING_ID.LANGUAGE, value: 'en' },
  ]);

  const [selectedFigureSetting, setSelectedFigureSetting] =
    useState<string>('');
  const [selectedNotificationSetting, setSelectedNotificationSetting] =
    useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  /**
   * init setting .
   */
  useEffect(() => {
    const langCode = settingRes?.data?.option?.lang ?? navigator.language;
    let newUserSettingList = [...userSettingList];
    if (
      settingRes &&
      settingRes.data &&
      settingRes.data.option &&
      settingRes.data.option.ui
    ) {
      const jsonSetting = JSON.parse(settingRes.data.option.ui);
      const userSettingList = jsonSetting as UserSetting[];
      if (userSettingList) {
        newUserSettingList = [...userSettingList];
      }
    }
    if (newUserSettingList) {
      const findIndex = newUserSettingList.findIndex(
        (_) => _.id === SETTING_ID.LANGUAGE,
      );
      if (findIndex === -1) {
        newUserSettingList.push({
          id: SETTING_ID.LANGUAGE,
          value: LanguageCodeToSettingValue(langCode),
        });
      } else {
        newUserSettingList[findIndex].value =
          LanguageCodeToSettingValue(langCode);
      }
      setUserSettingList(newUserSettingList);
    }
  }, [settingRes]);

  /**
   * userSettingList 이 바뀌었을 때 목록에서 보여질 선택된 항목 이름 갱신.
   */
  useEffect(() => {
    // figureSetting.
    const figureSettings = userSettingList.filter(
      (_) =>
        SETTING_ID.SHOW_FIGURE_INFO_ALWAYS == _.id ||
        _.id == SETTING_ID.SHOW_FIGURE_INFO_TOUCH,
    );
    for (let i = 0; i < figureSettings.length; ++i) {
      switch (figureSettings[i].id) {
        case SETTING_ID.SHOW_FIGURE_INFO_ALWAYS:
        case SETTING_ID.SHOW_FIGURE_INFO_TOUCH:
          if (figureSettings[i].value === true) {
            setSelectedFigureSetting(SettingIdToTextID(figureSettings[i].id));
          }
          break;
      }
    }
    // notify settings.
    const notifyAllSetting = userSettingList.find(
      (_) => _.id === SETTING_ID.NOTIFICATION_ALL,
    );
    if (notifyAllSetting && notifyAllSetting.value === true) {
      setSelectedNotificationSetting('ON');
    } else {
      setSelectedNotificationSetting('OFF');
    }
    // language.
    const languageSetting = userSettingList.find(
      (_) => _.id === SETTING_ID.LANGUAGE,
    );
    console.log(
      '!!!!!!! userSettingList useEffect - languageSetting : ',
      languageSetting,
    );
    if (languageSetting) {
      setSelectedLanguage(
        LanguageSettingValueToString(languageSetting.value.toString()),
      );
    }
  }, [userSettingList]);
  const handleLogout = useCallback(()=>{
    showConfirmPopup({titleText:'로그아웃 하시겠습니까?', confirmText:'로그아웃', cancelText:'취소', onConfirm:()=>{}});
  },[]);
  const handleLogoutAllBrowser = useCallback(()=>{
    SessionListFullScreenModal.createModal();
  },[]);
  const handleShowFigureInfo = useCallback(() => {
    SettingListFullScreenModal.createModal({
      titleId: '피규어/아이템 정보 표시',
      settingDataList: ShowFigureInfoSettings,
      initUserSettingList: userSettingList,
      handleOnClose: (data: UserSetting[]) => {
        setUserSettingList(data);
      },
    });
  }, [SettingListFullScreenModal, ShowFigureInfoSettings]);
  const handleNotification = useCallback(() => {
    SettingListFullScreenModal.createModal({
      titleId: '알림 설정',
      settingDataList: NotificationSettings,
      initUserSettingList: userSettingList,
      handleOnClose: (data: UserSetting[]) => {
        setUserSettingList(data);
      },
    });
  }, [SettingListFullScreenModal, NotificationSettings]);
  const handleLanguage = useCallback(() => {
    SettingListFullScreenModal.createModal({
      titleId: '표시 언어',
      settingDataList: LanguageSettings,
      initUserSettingList: userSettingList,
      handleOnClose: (data: UserSetting[]) => {
        setUserSettingList(data);
      },
    });
  }, [SettingListFullScreenModal, LanguageSettings]);
  const handleServiceTerms = useCallback(()=>{
    if(!termsRes?.svc)
      return;
    TextFullScreenModal.createModal({
      titleProps: {
        locale: { textId: '이용 약관' },
        hasTag: true,
      },
      contentsProps: {
        locale: { textId: termsRes.svc },
        hasTag: true,
      },
      closeBtnShape:'arrow'
    });
  },[termsRes]);
  const handlePersonalTerms = useCallback(()=>{
    if(!termsRes?.privacy)
      return;
    TextFullScreenModal.createModal({
      titleProps: {
        locale: { textId: '개인정보처리방침' },
        hasTag: true,
      },
      contentsProps: {
        locale: { textId: termsRes.privacy },
        hasTag: true,
      },
      closeBtnShape:'arrow'
    });
  }, [termsRes]);
  
  const handleWithdraw = useCallback(()=>{
    WithdrawFullScreenModal.createModal();
  },[]);
  const handleOnClose = useCallback(async () => {
    const settingData: ProfileSettingData = { option: {} };
    const languageSetting = userSettingList.find(
      (_) => _.id === SETTING_ID.LANGUAGE,
    );
    if (languageSetting) {
      settingData.option.lang = languageSetting.value.toString();
      i18n.changeLanguage(languageSetting.value.toString());
    }

    settingData.option.ui = JSON.stringify(userSettingList);
    console.log('handleOnClose - settingData : ', settingData);
    const res = await mutationPostProfileMeSetting.mutateAsync({
      data: settingData,
    });
    console.log('handleOnClose - res : ', res);

    onRequestClose();
    navigate(-1);
  }, [userSettingList, LanguageSettings]);

  return {
    selectedLanguage,
    selectedFigureSetting,
    selectedNotificationSetting,
    handleLogout,
    handleLogoutAllBrowser,
    handleShowFigureInfo,
    handleNotification,
    handleLanguage,
    handleServiceTerms,
    handlePersonalTerms,
    handleWithdraw,
    handleOnClose,
  };
};

export default useProfileAccountSettingFullScreenModal;
