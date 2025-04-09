import React, { Suspense, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet } from 'react-router-dom';
import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import 'the-new-css-reset/css/reset.css';
import PopupContainer from './pages/_shared/popup/PopupContainer';
import { GlobalModal, ModalProvider } from './components/_core/ModalCore';
import { auth } from '@/common/utils/auth';
import { refreshCredential } from '@colorverse/auth';
import useAuth from './common/hooks/use-auth';
import ReactGA from 'react-ga4';
import TagManager from 'react-gtm-module';
import { GA_ID, GTM_ID } from './common/constants';
import DOMPurify from 'dompurify';
import { WebCustomText } from './components/CustomElements/Text';
import { ConstantsEx } from 'client-core';
import { BASE_DRACO_URL } from '@/common/constants';

import './App.scss';

// import useUserAPI from './apis/User/User';
// import useMyRoomAPI from './apis/Space/MyRoom';
const queryClient = new QueryClient();
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    load: 'languageOnly',
    lng: 'ko',
    fallbackLng: 'ko',
    ns: ['translation'],
    // resources: {
    //   ko: {
    //     translation: localeKO,
    //   },
    // },
    backend: {
      // 추후 world ID로 분기 예정
      loadPath: `https://develop.colorverseapis.com/v1/world/worlds/1mkSuyvWsZAZKE2cuDzmzI/multilingual/i18n.json?lang={{lng}}`,
      queryStringParams: { t: Date.now() },
    },
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    debug: true,
  });

const LightThema = {
  colors: {
    primary: '#DBFC3D',
    secondary: '#FF2164',
    tertiary: '#63FFF6 ',
    fail: '#FF4A4D',
    grayScales: [
      '#FFFFFF', //$gray-scale-100
      '#F9F9F9', //$gray-scale-200
      '#EEEEEE', //$gray-scale-300
      '#BBBBBB', //$gray-scale-400
      '#999999', //$gray-scale-500
      '#666666', //$gray-scale-600
      '#000000', //$gray-scale-700
    ],
    defaultBackgound: '#FFFFFF',
    elevatedBackground: '#F9F9F9',
    disabledBackground: '#BBBBBB',
  },
  maxWidth: '750px',
};

type AppProps = {
  outlet?: any;
};
const checkBrowserSize = ($rootStyle: CSSStyleDeclaration) => {
  if (!$rootStyle) {
    return;
  }
  const heightPerOne = window.innerHeight * 0.01;
  $rootStyle.setProperty('--vh', `${heightPerOne}px`);
};
const handleResize = () => {
  checkBrowserSize(document.documentElement.style);
};
const handleOrientationChange = () => {
  checkBrowserSize(document.documentElement.style);
};

const checkKeyboardSize = ($rootStyle: CSSStyleDeclaration) => {
  if (!$rootStyle) {
    return;
  }
  const isKeyboardActive: boolean =
    window.visualViewport!.height < window.innerHeight;
  const keyboardHeight = window.innerHeight - window.visualViewport!.height;
  if (!isKeyboardActive) {
    $rootStyle.setProperty('--keyboard-height', `${0}px`);
  } else {
    $rootStyle.setProperty('--keyboard-height', `${keyboardHeight}px`);
  }
};

const handleViewportResize = () => {
  checkKeyboardSize(document.documentElement.style);
};

const App = ({ outlet }: AppProps) => {
  const { signin } = useAuth();

  const handleDisablePinchZoom = useCallback((e: any) => {
    e.preventDefault();
    // special hack to prevent zoom-to-tabs gesture in safari
    document.body.attributeStyleMap.set('zoom', 0.999999);
  }, []);

  React.useLayoutEffect(() => {
    const $rootStyle = document.documentElement.style;
    if ($rootStyle) {
      const thema = LightThema;
      $rootStyle.setProperty('--primary-color', thema.colors.primary);
      $rootStyle.setProperty('--secondary-color', thema.colors.secondary);
      $rootStyle.setProperty('--tertiary-color', thema.colors.tertiary);
      $rootStyle.setProperty('--fail-color', thema.colors.fail);

      $rootStyle.setProperty('--max-width', thema.maxWidth);
      $rootStyle.setProperty('--keyboard-height', `${0}px`);

      $rootStyle.setProperty(
        '--default-background-color',
        thema.colors.defaultBackgound,
      );
      $rootStyle.setProperty(
        '--elevated-background-color',
        thema.colors.elevatedBackground,
      );
      $rootStyle.setProperty(
        '--disabled-background-color',
        thema.colors.disabledBackground,
      );

      thema.colors.grayScales.map((val, idx) => {
        $rootStyle.setProperty(`--gray-scale-${idx + 1}00`, val);
      });
    }
  }, []);

  const autoSignin = React.useCallback(async () => {
    console.log('autoSignin - ');
    if (!auth.isLogined()) {
      const refeshToten = auth.getRefreshToken();
      if (!refeshToten) {
        return;
      }

      await refreshCredential(auth);

      signin();
    }
  }, [signin]);

  React.useEffect(() => {
    autoSignin();
    ReactGA.initialize(GA_ID);
    const tagManagerArgs = {
      gtmId: GTM_ID,
    };
    TagManager.initialize(tagManagerArgs);

    ConstantsEx.setDracoConfig(BASE_DRACO_URL);

    handleResize();

    /**iOS input focus 시 viewport */
    window.visualViewport!.onresize = handleViewportResize;

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('gesturestart', handleDisablePinchZoom);
    document.addEventListener('gesturechange', handleDisablePinchZoom);
    document.addEventListener('gestureend', handleDisablePinchZoom);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);

      document.removeEventListener('gesturestart', handleDisablePinchZoom);
      document.removeEventListener('gesturechange', handleDisablePinchZoom);
      document.removeEventListener('gestureend', handleDisablePinchZoom);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        {outlet ? outlet : <Outlet />}
        <ReactQueryDevtools initialIsOpen={false} />
        <PopupContainer />
        <Suspense fallback={<></>}>
          <GlobalModal />
        </Suspense>
      </ModalProvider>
    </QueryClientProvider>
  );
};
DOMPurify.setConfig({
  ADD_TAGS: ['custom-text'],
  ADD_ATTR: ['bold', 'italic', 'deco'],
});
customElements.define('custom-text', WebCustomText);
export default App;

export const setMaxWidth = (maxWidth: string) => {
  LightThema.maxWidth = maxWidth;

  const $rootStyle = document.documentElement.style;
  if ($rootStyle) {
    $rootStyle.setProperty('--max-width', maxWidth);
  }
};
