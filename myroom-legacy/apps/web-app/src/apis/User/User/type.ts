import { CommonResponse } from '@/apis/_common/type';

export type UserAvailabilityParams = {
  query: string;
};

export type UsersMeData = {
  account: {
    password: string;
  };
  info: {
    birthday: string;
    email: string;
  };
};

export type UsersMeAppData = {
  option: {
    alarm: {
      night: true;
      colorverse: true;
      feed: true;
      social: true;
      town: true;
      land: true;
      nightperiod: {
        tz: 900;
        start: 3600;
        end: 21600;
      };
    };
    privacy: {
      feed: 3;
      friendlist: 3;
      followlist: 3;
      birthday: 3;
      online: 3;
    };
    term: {
      term1_id: true;
      term2_id: false;
    };
  };
  world: {
    [key: string]: {
      join: boolean;
      profile_id: string;
    };
  };
};
export type UserMeProfileListItemData = {
  _id: string;
  stat: {
    created: number;
    updated: number;
  };
  name: string;
  option: {
    interest: number[];
    nick: string;
  };
  resource: {
    image_selfie: string;
  };
  txt: {
    desc: string;
  };
  user_id: string;
  world_id: string;
  avatar_id: string;
  myroom_id: string;
};
export type UsersMeProfilesParams = {
  page: number;
  limit: number;
};

export type UserMeResponse = CommonResponse & {
  data: {
    _id: string;
    stat: {
      created: number;
      updated: number;
    };
    account: {
      account_type: number;
      apple: {
        id: string;
      };
      fb: {
        id: string;
      };
      google: {
        id: string;
      };
      id: string;
      kakao: {
        id: string;
      };
      line: {
        id: string;
      };
      tw: {
        id: string;
      };
      user_type: number;
    };
    info: {
      birthday: Date;
      email: string;
    };
  };
};

export type UserMeProfilesResponse = CommonResponse & {
  count: {
    current: number;
    limit: number;
    page: number;
    total: number;
  };
  list: UserMeProfileListItemData[];
};
