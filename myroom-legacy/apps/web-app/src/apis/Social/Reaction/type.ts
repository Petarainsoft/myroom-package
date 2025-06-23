import {
  CommonOrderParams,
  CommonPagingParams,
  CommonResponse,
} from '@/apis/_common/type';

export type MeReactionsParams = CommonOrderParams &
  CommonPagingParams & {
    target_type: "land" | "item" | "twon" | "post" | "feed";
    filter_reaction?: ReactionType;
};
  


export type ReactionParams = {
  origin_profile_id: string;
  reaction: ReactionType;
};

export type ReactionProfileParams = CommonOrderParams &
  CommonPagingParams & {
    filter_reaction: ReactionType;
    reaction: ReactionType;
  };


export type ReactionType = 'like';

export interface ReactionsRes {
  count: {
    current: number;
    page: number;
    limit: number;
    total: number;
  };
  list: {
    _id: {
      profile_id: string;
      target_id: string;
    };
    stat: {
      created: number;
      updated: number;
      reaction: {
        like: number;
      };
    };
    target_type: number;
    user_id: string;
    world_id: string;
  }[];
}

export interface ReactionPostRes {
  data: {
    _id: string;
    stat: {
      created: number;
      updated: number;
      comment: number;
      reaction: {
        like: number;
      };
      view: number;
    };
    origin_profile_id: string;
    target_type: number;
    world_id: string;
  };
  t: number;
}

export type MyReactionsRes = CommonResponse & {
  data: {
    _id: {
      target_id: string;
      profile_id: string;
    };
    stat: {
      created: number;
      reaction: {
        like: number;
      };
      updated: number;
    };
    target_type: number;
    user_id: string;
    world_id: string;
  };
  t: number;
};

export type MyReactionsByTypeRes = CommonResponse & {
  current: {
    limit: number;
    page: number;
    total: number;
  };
  list: {
    _id: {
      profile_id: string;
      target_id: string;
    };
    stat: {
      created: number;
      reaction: {
        like: number;
      };
      updated: number;
    };
    target_type: number;
    user_id: string;
    world_id: string;
  }[];
}
