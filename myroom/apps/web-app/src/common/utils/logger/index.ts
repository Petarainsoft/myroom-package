import { ENABLE_LOG, ENV } from '@/common/constants';
import Logger from '@colorverse/logger';


export const logger = new Logger({
    env: ENV,
    enableLog: ENABLE_LOG,
    enableSentry: false,
    dsnKey: '',
});


//TODO: logger 주석해제
/** 
//enableSentry value는 함수로 빼서 현재 서버랑 비교해서 live가 아닐 때만 사용(default)
const handleEnableSentry = (bool: boolean) => {
  return bool && ENV === 'LIVE';
};

export const testObj = new Logger({
  env: ENV,
  enableSentry: handleEnableSentry(false),
  enableLog: true,
  dsnKey: SENTRY_DSN_KEY,
});
*/
