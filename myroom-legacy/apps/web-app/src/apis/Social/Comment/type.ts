import { CommonDateLimitParams, CommonOrderParams, CommonResponse } from '@/apis/_common/type';

export type CommentsParams = CommonOrderParams &
  CommonDateLimitParams & {
    target_id?: string;
    target_type?: string;
    town_id?: string;
    my?: string;
    profile_id?: string;
    parent_id?: string;
    mention_id?: string;
    fixed?: string;
    total?: string;
  };

export type CommentData = {
  mention_id?: string;
  option?: {
    fixed: boolean;
    language: string;
    show: boolean;
  };
  parent_id?: string;
  resource?: {
    image: string[];
    video: string[];
  };
  section_id?: string;
  target_id?: string;
  target_profile_id?: string;
  town_id?: string;
  txt?: {
    contents: string;
    hashtag?: string[];
    title?: string;
  };
};


export type CommentsResponse = CommonResponse& {
  count: {
    current: number,
    end: number,
    start: number,
    total: number
  },
  list: [
    {
      _id: string,
      stat: {
        created: number,
        updated: number,
        comment: number,
        reaction: {
          like: number
        },
        view: number
      },
      mention_id: string,
      option: {
        contents_type: string,
        endts: number,
        fixed: boolean,
        fixedts: number,
        language: string,
        show: boolean,
        startts: number,
        target_creator_commented: boolean,
        target_creator_liked: boolean
      },
      parent_id: string,
      profile_id: string,
      target_id: string,
      target_profile_id: string,
      txt: {
        contents: string,
        hashtag: string[],
        title: string
      },
      user_id: string
    }
  ]
}