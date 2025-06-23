import { CommonPagingParams } from "@/apis/_common/type";





export type BannerParams = CommonPagingParams &  {
    w: string;
    code: string;
}