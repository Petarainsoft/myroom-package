export interface FollowListResponse {
  current: {
    limit: number;
    page: number;
    total: number;
  };
  list: {
    _id: string;
  }[];
  scrollid: string;
  t: number;
}

export interface FollowParams {
  profile_id: string;
  page?: number;
  limit?: number;
  key?: string; //key 구분용
}

export interface FollowRes {
  current: {
    page: number;
    limit: number;
    total: number;
  };
  list: {
    _id: string;
  }[];
}
