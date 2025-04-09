import { CommonPagingParams, CommonResponse } from "@/apis/_common/type";

export type SessionGetParam = CommonPagingParams & {};

export type SessionResponse = CommonResponse & {
  count:{
    current:number;
    limit:number;
    page:number;
    total:number;
  };
  list:SessionData[];
};

export type SessionData = {
  _id:string;
  option:{
    country_city:string;
    country_code:string;
    device_info:string;
  };
  stat:{
    created:number;
    expired:number;
    updated:number;
  }
}