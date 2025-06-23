import {
  CommonDateLimitParams,
  CommonOrderParams,
  CommonResponse,
} from '@/apis/_common/type';
export const BallonListTypes = ['myroom', 'active', 'inactive', 'all'] as const;
export type BALLOON_LIST_TYPE = (typeof BallonListTypes)[number];
export const BalloonOperationTypes = [
  'activate',
  'inactivate',
  'delete',
  'read',
] as const;
export type BALLOON_OPERATION_TYPE = (typeof BalloonOperationTypes)[number];
export type BalloonsGetParam = CommonOrderParams &
  CommonDateLimitParams & {
    testStart?: number;
    testEnd?: number;
    testTotal?: number;
    myroom_id: string;
    type: BALLOON_LIST_TYPE;
    total?: string;
  };

export type BalloonPostParam = {
  balloon_market_product_id: string;
  myroom_id: string;
  option: { language: string };
  txt: {
    contents: string;
  };
};
export type BalloonPatchParam = {
  myroom_id: string;
  operation: BALLOON_OPERATION_TYPE;
  targets: string[];
};

export type BalloonData = {
  _id: string;
  stat: { created: number; updated: number; owner_view: boolean };
  balloon_item_grade: string;
  balloon_item_id: string;
  myroom_id: string;
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
    version: number;
  };
  txt: {
    contents: string;
    snippet: string;
    hashtag: string[];
    title?: string;
  };
  writer_profile_id: string;
};

export type PostBalloonsResponse = CommonResponse & {
  data: BalloonData;
};
export type GetBalloonsResponse = CommonResponse & {
  count: {
    current: number;
    end: number;
    start: number;
    total: number;
  };
  list: BalloonData[];
  free_balloon: {
    count: number;
    updated: number;
  };
};

export type PatchBalloonsResponse = CommonResponse & {
  count: {
    current: number;
    end: number;
    start: number;
    total: number;
  };
  list: BalloonData[];
  t: number;
};

export type GetBalloonDataResponse = CommonResponse & {
  data: BalloonData;
  t: number;
};

export type GetMeFreeBalloonResponse = CommonResponse & {
  data: {
    _id: string;
    stat: {
      created: number;
      updated: number;
    };
    free_balloon: {
      count: number;
      updated: number;
    };
  };
  t: number;
};
