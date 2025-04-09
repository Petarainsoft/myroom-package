import {
  CommentInputScopeType,
  CommonDateLimitParams,
  CommonOrderParams,
} from '@/apis/_common/type';

export type StatusMessagesParams = CommonOrderParams &
  CommonDateLimitParams & {
    filter?: string;
    profile_id: string;
  };

export type StatusMessageData = {
  option: {
    comments_enable: boolean;
    comments_input_scope: CommentInputScopeType;
    fixed: boolean;
    language: string;
    show: boolean;
  };
  resource: {
    image: string[];
    action: string[];
  };
  txt: {
    contents: string;
    hashtag: string[];
    title: string | null;
  };
};

// export type TStatusMessagesDataRes ={
//   count:Count;
//   list:List[];
// }
