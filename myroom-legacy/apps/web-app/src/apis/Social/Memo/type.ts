import { CommentInputScopeType, CommonDateLimitParams, CommonOrderParams } from '@/apis/_common/type';




export type MemosParams = CommonOrderParams &  CommonDateLimitParams & {
    filter: string;
    profile_id: string;
    my: number;
}


export type MemoData =  {
    _id: string,
    option: {
        comments_enable: boolean,
        comments_input_scope: CommentInputScopeType,
        fixed: boolean
        language: string,
        show: boolean,
    },
    resource: {
        image: string[]
    },
    txt: {
        contents: string,
        hashtag: string[],
        title: string,
    }
  }