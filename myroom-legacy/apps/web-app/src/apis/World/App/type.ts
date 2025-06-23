import { CommonResponse } from "@/apis/_common/type";

export type AppInfoResponse = CommonResponse & {
  data : {
    _id : string,
    stat : {created : number, updated : number},
    option:{
      term:{
        optional:string[],
        order:string[],
        privacy:string,
        required:string[],
        svc:string,
      },
    },
    txt:{
      desc:{ko:string},
      name:{ko:string},
    },
    worldId:string[],
  },
};