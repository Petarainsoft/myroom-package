export interface IItemMemoRequestData {
  item_id: string;
  item_instance_id: string;
  link?: {
    url?: string[];
    youtube?: string[];
  };
  myroom_id?: string;
  option: {
    language: string;
  };
  resource: {
    image: string[];
    video?: string[];
  };
  txt: {
    contents: string;
  };
}

export interface IItemMemoResponseData {
  _id: string;
  stat: {
    created: number;
    updated: number;
  };
  item_id: string;
  item_instance_id: string;
  link: {
    url: string[];
    youtube: string[];
  };
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
  profile_id: string;
  resource: {
    image: string[];
    video: string[];
  };
  txt: {
    contents: string;
    hashtag: string[];
    title: string | null;
  };
  user_id: string;
}

export interface IItemMemoResponse {
  data: IItemMemoResponseData;
  t: number;
}

export interface IItemMemoGetRequestParams {
  profile_id?: string;
  myroom_id?: string;
  item_instance_id?: string;
  isHome?: boolean; //홈에서 메모를 가져올때 key값을 다르게 하기 위해
}
export interface IItemMemoPatchRequestParams {
  myroom_id?: string;
  item_instance_id?: string;
}

export interface IItemMemoListItem {
  item_instance_id: string;
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
    title: string | null;
  };
  user_id: string;
  world_id: string;
}
export interface IItemMemoGetResponseData {
  count: {
    current: number;
    end: number;
    start: number;
    total: number;
  };
  list: IItemMemoListItem[];
}
