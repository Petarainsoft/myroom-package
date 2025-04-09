export type CommonPagingParams = {
  page?: number;
  limit?: number;
};

export type CommonOrderParams = {
  order?: 'asc' | 'desc';
  orderby?: 'recent' | 'like' | 'stat.created';
};

export type CommonDateLimitParams = {
  start?: number;
  end?: number;
  limit?: number;
};

export type CommentInputScopeType = 'all' | 'friend' | 'follower ';

export type CommonResponse = {
  error?: number;
  error_desc?: {
    ko?: string;
    en?: string;
    ja?: string;
  };
};
