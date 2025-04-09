import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import '../../src/App.scss';

const Thema = {
  colors: {
    primary: '#DBFC3D',
    secondary: '#FF2164',
    tertiary: '#63FFF6 ',
    fail: '#FF4A4D',
    defaultBackground: '#FFFFFF',
    fonts: [
      '#FFFFFF',
      '#F9F9F9',
      '#EEEEEE',
      '#BBBBBB',
      '#999999',
      '#666666',
      '#000000',
    ],
  },
};

i18n
  // .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'ko',
    fallbackLng: 'ko',
    ns: ['translation'],
    // resources: {
    //   ko: {
    //     translation: localeKO,
    //   },
    // },
    // backend: {
    //   loadPath: 'https://public.develop.colorver.se/locales/{{lng}}.json',
    // },
    debug: true,
  });

const InitialStyleComponent = () => {
  React.useLayoutEffect(() => {
    const $rootStyle = document.documentElement.style;
    if ($rootStyle) {
      $rootStyle.setProperty('--primary-color', Thema.colors.primary);
      $rootStyle.setProperty('--secondary-color', Thema.colors.secondary);
      $rootStyle.setProperty('--tertiary-color', Thema.colors.tertiary);
      $rootStyle.setProperty('--fail-color', Thema.colors.fail);
      $rootStyle.setProperty(
        '--default-background-color',
        Thema.colors.defaultBackground,
      );

      Thema.colors.fonts.map((val, idx) => {
        $rootStyle.setProperty(`--font-color-${idx + 1}00`, val);
        $rootStyle.setProperty(`--gray-scale-${idx + 1}00`, val);
      });
    }
  }, []);
  return <></>;
};

export default InitialStyleComponent;
