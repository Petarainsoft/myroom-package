import { CommonResponse } from "@/apis/_common/type";

export type TermsResponse = CommonResponse & {
  data:{
    data : {
      _id:string,
      stat : {created:number, updated:number},
      option:{
        content_type:string,
        rev:number,
      },
      app_id:string,
      txt:{
        content:{ko:string, en:string},
      }
    },
  }
  
}