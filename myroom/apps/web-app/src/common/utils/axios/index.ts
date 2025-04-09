import axios from "axios";
import { SERVER_INFO } from "../../constants";
import { auth, ACCESS_TOKEN_EXPIRES, ACCESS_TOKEN } from '../auth';
import { refreshCredential } from '@colorverse/auth';
import { now } from '../date';

//- 서버별 instance 생성 예정
export const instance = axios.create({});


instance.interceptors.request.use(async (config) => {
  config.headers.set("X-API-KEY", SERVER_INFO.KEY);

  if (auth.isLogined()) {
    const nowDate = now();
    if (nowDate.isAfter(ACCESS_TOKEN_EXPIRES)) {
      await refreshCredential(auth);
    }
    config.headers.set("Authorization", `Bearer ${ACCESS_TOKEN}`);
  }

  return config;
});

instance.interceptors.response.use((response) => {
  return response;
});