import { CommonPagingParams } from "@/apis/_common/type"


export type ItemInstanceRes = {
  _id: string;
  item_id: string;
  profile_id: string;
  option: {
    client_instance_id: string;
  };
  resource: {
    image: string[];
    video: string[];
    memo: string;
  };
  link: {
    url: string[];
    youtube: string[];
  };
  stat: {
    created: number;
    updated: number;
  };
}

export type InstanceDataTypeReq = {
  instance_id: string;
  item_id: string;
  option: {
    client_instance_id: string;
  };
  resource: {
    image: string[];
    video: string[];
    memo: string;
  };
  link: {
    url: string[];
    youtube: string[];
  };
}

