import { ENABLE_LOG, ENV } from '@/common/constants';



export const logger = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};


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
