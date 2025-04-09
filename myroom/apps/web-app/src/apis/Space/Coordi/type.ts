import { CommonPagingParams } from "@/apis/_common/type"


export type CoordiData = {
  resource: {
    thumbnail: string
  },
  option: {
    items: string[]
  }
}


export type CoordisParams = CommonPagingParams;