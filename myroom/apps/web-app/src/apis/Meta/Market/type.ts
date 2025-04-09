import { CommonPagingParams, CommonResponse } from "@/apis/_common/type";

export type MarketSearchParams = CommonPagingParams & {
  w?: string;
  profile_id?: string;
  category?: string;
  selling?: boolean;
}
export type MarketPurchaseProduct = {
  product_id:string
}
export type MarketPurchaseData = {
  products: MarketPurchaseProduct[],
  total_price: PriceData[]
}
export type MarketProductIdResponse = CommonResponse & {
  data : MarketProductData
}

export type MarketProductsResponse = CommonResponse & {
  count: {
    current: number,
    page: number,
    limit: number
  },
  list: MarketProductData[]
}
export type MarketPurchaseResponse = CommonResponse & {
  data:{
    _id:string,
    profile_id:string,
    state:number,
    txt:{title:string},
    option:{
      category:number[],
      payment:PriceData[],
    },
    product:MarketPurchaseProductData[],
    stat:{created:number, updated:number}
  }
};
export type MarketPurchaseProductData = {
  id:string,
  quantity:number,
  title:string,
  category:number[],
  payment_type:number,
  payment_amount:number,
  item:MarketProductItemData[]
}

export type MarketProductData = {
  _id: string,
  type: number,
  profile_id: string,
  world_id: string[],
  status: number,
  txt: {
    title: { ko: string, en: string },
    desc: { ko: string, en: string },
    hashtag: string[],
  },
  resource: { thumbnail: string, preview: string },
  option: {
    asset_type: number,
    category: number[],
    sale_version: number,
    sale_accept: number,
    sale_start: number,
    sale_end: number,
    selling: boolean,
    price: { type: number, amount: number }
    blind: boolean,
    delete_request: boolean,
    items: MarketProductItemData[]
  },
  stat: { created: number, updated: number } 
}

type MarketProductItemData = {
  type: number,
  id: string,
  quantity: number
}

export type PriceData = {
  //1 : 비매품 , 2: 무료(0) , 3: gold , 4 : 컬러벅스
  type: number,
  amount: number
};