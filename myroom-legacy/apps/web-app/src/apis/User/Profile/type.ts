import { CommonResponse } from '@/apis/_common/type';

export type ProfileData = {
  name?: string;
  option?: {
    background_color?: string;
    interest?: number[];
    nick?: string;
    selfie_type?: string;
  };
  resource?: {
    avatar_selfie?: string;
    image_selfie?: string;
  };
  txt?: {
    desc?: string;
  };
};

export type ProfileAvailabilityParams = {
  name: string;
};

export type ProfileResponse = CommonResponse & {
  data: {
    _id: string;
    name: string;
    myroom_id?: string;
    avatar_id?: string;
    stat: { created: number; updated: number };
    option: {
      interest: number[];
      background_color: string;
      nick: string;
      selfie_type: string; // image | avatar
    };
    resource: {
      image_selfie: string;
      avatar_selfie: string;
    };
    txt: {
      desc: string;
    };
    user_id: string;
    world_id: string;
  };
};

export type ProfileSettingResponse = CommonResponse & {
  data: ProfileSettingData;
};
export type ProfileSettingData = {
  option: {
    lang?: string;
    ui?: string;
  };
};

export type ProfileResourceType =
  | 'count'
  | 'friend'
  | 'follow'
  | 'normal'
  | 'status-message';
