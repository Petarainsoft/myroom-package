import { CommonPagingParams, CommonResponse } from '@/apis/_common/type';



export type ItemUploadParams = {
  force?: boolean;
}

export type ItemParams = {
  me_check?: boolean;
}
export type ItemsParams = CommonPagingParams & {
  w: string,
  profile_id?: string,
  category?: string,
  selling?: boolean,
}

export type MeItemsParams = CommonPagingParams & {
  category?: string,
}

export type UploadItemData = {
  txt: {
    title: {
      ko: string,
      en: string
    },
    desc: {
      ko: string,
      en: string
    },
    hashtag: [
      string
    ]
  },
  option: {
    version: number,
    category: string,
    sale_status: number,
    price: {
      type: number,
      amount: number
    }
  },
  resource: {
    thumbnail: string,
    preview: string
  }
}
export type ItemData = {
  _id: string,
  profile_id: string;
  world_id: string[],
  asset_type: number,
  txt: {
    title: { ko: string, en: string },
    desc: { ko: string, en: string },
    system_hashtag: string[], // 시스템 해시태그
  },
  hashtag: string[],

  resource: {
    manifest: string,
    preview: string,
    thumbnail: string,
  },
  option: {
    version: number,
    ready_status: number,
    category: string[],
    sale_version: number,
    sale_accept: number,
    sale_start: number,
    sale_end: number,
    sale_status: number,
    sale_review_status: number,
    immediate_sale: boolean,
    selling: boolean,
    price: { type: number, amount: number },
    judge_status: number,
    blind: boolean,
    delete_request: boolean,
  },
  stat: { created: number, updated: number }
}

export type ItemResponse = CommonResponse & {
  data: ItemData
}
export type ItemsResponse = CommonResponse & {
  count: {
    current: number,
    page: number,
    limit: number,
  }
  list: ItemData[]
}

export type MeItemResponse = CommonResponse & {
  data: MeItemData
}
export type MeItemsResponse = CommonResponse & {
  count: {
    current: number,
    page: number,
    limit: number,
  }
  list: MeItemData[]
}


export type MeItemData = {
  _id: string,
  item_id: string,
  profile_id: string,
  option: {
    quantity: number
  },
  category: string[],
  stat: {
    created: number,
    updated: number
  }
}