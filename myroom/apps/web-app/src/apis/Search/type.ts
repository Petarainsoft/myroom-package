export type MarketSearchParams = {
  category: string;
  filter?: string;
  hashtag?: string;
  limit?: number;
  scroll_id?: string;
};

export type ProfileSearchParams = {
  search_string?: string;
  limit?: number;
  scroll_id?: string;
};

export type MyroomSearchParams = {
  search_string?: string;
  limit?: number;
  scroll_id?: string;
};


export type TagSearchParams = {
  search_string?: string;
  limit?: number;
  scroll_id?: string;
};

export type ItemMatchSearchParams = {
  ht_code?: string;
  limit?: number;
  scroll_id?: string;
};

export type ItemsSearchParams = {
  search_string?: string;
  limit?: number;
  scroll_id?: string;
};

export type FollowSearchParams = {
  profile_id: string;
  nickname: string;
  limit?: number;
  scroll_id?: string;
};

export type SearchData = {
  _id: string;
}
export interface SearchProfileResponse {
  total: number;
  list: SearchData[];
  scroll_id: string;
  t: number;
}

export interface SearchTagResponse{
  list: [
    {
      count: {
        item: number,
        ping: number
      },
      hashtag: string,
      ht_code: string
    }
  ],
  scroll_id: string,
  t: number,
  total: number
}

export interface SearchItemsResponse {
  list: {
    _id: string;
  }[];
  scroll_id: string;
  t: number;
  total: number;
}


export interface SearchMyroomResponse {
  list: {
    _id: string;
  }[];
  scroll_id: string;
  t: number;
  total: number;
}

export interface SearchItemsMatchResponse {
  list: {
    _id: string;
  }[];
  scroll_id: string;
  t: number;
  total: number;
}



export interface SearchProductsResponse {
  current: {
    limit: number;
    page: number;
    total: number;
  };
  list: {
    _id: string;
  }[];
  scroll_id: string;
  t: number;
}
