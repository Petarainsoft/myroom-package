import { AxiosInstance } from 'axios';
import { SERVER_INFO } from "../../constants";

export type RequestInstance = AxiosInstance;

export type TRequestOptions = {
    headers?:any;
    method: "POST" | "GET" | "DELETE" | "PUT" | "PATCH";
    data?: any;
    params?: any;
    mock?: boolean
  };
  
const onRequest = async <T>(instance:RequestInstance, url:string, { method, data, headers, params, mock = false }: TRequestOptions): Promise<T | null> => {
  try {
    
      const res = await instance.request<T>({ baseURL: mock? 'http://localhost:5173' : SERVER_INFO.URL,
        method, url, data, headers, params, validateStatus: (status) => {
          //400번대 오류만 웹에서 핸들링
          return status < 500;
      } });
    
      // if(res.status !== 200) {
      //   console.error(res);
      // }
  
      return res.data;
    }
    catch {
      //500번이상 서버 오류는 별도의 공용 에러핸들러 필요.
      return null;
    }
  };
  
  export default onRequest;
  