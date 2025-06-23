import { CommonResponse } from "@/apis/_common/type"

export type AvatarReqData = {
  manifest: JSON
}

export type AvatarData = {
  _id : string,
  profile_id:string,
  resource:{manifest:string},
  option:{version:number},
  stat:{created:number, updated:number},
}
/**
 * 아바타 생성.
 */
export type AvatarsResponse = CommonResponse & {
  data : AvatarData
}
/**
 * 현재 프로필의 아바타 목록.
 */
export type AvatarsMeResponse = CommonResponse & {
  list : AvatarData[]
}