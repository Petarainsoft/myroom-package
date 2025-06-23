import { CommonPagingParams } from "@/apis/_common/type"



export type NotiesParams = CommonPagingParams & {
    w?: string;
    section?: string;
}

export type NoticeParams = NotiesParams & {
    list:number
}