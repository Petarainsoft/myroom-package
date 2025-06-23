import { MYROOM_APP_ENV } from 'client-core/common/environment';
import { MYROOM_APP_AUTH_SERVER__URL } from 'client-core/common/environment';
import { MYROOM_APP_AUTH_API_KEY } from 'client-core/common/environment';
import { MYROOM_APP_WORLD_ID } from 'client-core/common/environment';

export const ENV = MYROOM_APP_ENV;
export const AUTH_SERVER_URL = MYROOM_APP_AUTH_SERVER__URL;
export const AUTH_API_KEY = MYROOM_APP_AUTH_API_KEY;
export const WORLD_ID = MYROOM_APP_WORLD_ID;

export const BASE_IMG_URL = import.meta.env.VITE_REACT_APP_RESOURCE_DEV;
export const BASE_DRACO_URL = import.meta.env.VITE_REACT_APP_DRACO;
export const BASE_LOTTIE_URL = import.meta.env.VITE_REACT_APP_LOTTIE;
export const APP_VERSION = import.meta.env.VITE_REACT_APP_VERSION;
export const ENABLE_LOG =
  import.meta.env.VITE_REACT_APP_ENABLE_LOG === 'true' ? true : false;
export const ENABLE_LOG_LEVEL = import.meta.env.VITE_REACT_APP_ENABLE_LOG_LEVEL;

// sentry dsn key인데 logger 안에 환경변수로 넣으니까 충돌 생김.
// logger도 container에서 공통으로 사용할 수 있게 파일 이동 필요해보임. Logger 인스턴스 생성할 때 key값 넣어서 사용해야함.
export const SENTRY_DSN_KEY = import.meta.env.VITE_REACT_APP_SENTRY_DSN_KEY;
//------------------------------------------------------------------------------------------------------

export const ENABLE_LOCALCACHE =
  import.meta.env.VITE_REACT_APP_ENABLE_LOCALCACHE === 'true' ? true : false;
export const GA_ID = import.meta.env.VITE_REACT_APP_GA_ID;
export const GTM_ID = import.meta.env.VITE_REACT_APP_GTM_ID;

// 서버 정보
export const SERVER_INFO = {
  URL: AUTH_SERVER_URL,
  KEY: AUTH_API_KEY,
};
