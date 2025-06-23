import { CommonPagingParams } from "@/apis/_common/type"



export type FaqsParams = CommonPagingParams & {
    w?: string;
    section?: string;
}

export type FaqParams = FaqsParams & {
    list:number
}