import {
  CommonDateLimitParams,
  CommonOrderParams,
  CommonResponse,
} from '@/apis/_common/type';

export type FeedsGetParam = CommonOrderParams &
  CommonDateLimitParams & {
    content_type: string;
  };

export type FeedsGetResponse = CommonResponse & {
  count: {
    current: number;
    end: number;
    start: number;
    total: number;
  };
  list: FeedData[];
};

export type FeedData = {
  _id: string;
  stat: {
    created: number;
    updated: number;
    comment: number;
    reaction: { like: number };
    view: number;
  };
  option: {
    comments_enable: boolean;
    comments_input_scope: string;
    contents_type: string;
    endts: number;
    fixed: boolean;
    fixedts: number;
    language: string;
    show: boolean;
    startts: number;
    type: number;
    version: number;
  };
  profile_id: string;
  resource: {
    image: string[];
    item: string[];
    video: string[];
  };
  txt: {
    contents: string;
    hashtag: string[];
    title: string;
  };
  user_id: string;
  world_id: string;
};
