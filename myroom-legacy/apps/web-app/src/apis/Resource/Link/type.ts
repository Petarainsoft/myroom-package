export type linkResponse = {
  data: linkResponseData;
};

export type linkResponseData = {
  _id: string;
  option: linkDataOption;
  accept_lang: string;
  stat: Stat;
  url: string;
};

export type linkDataOption = {
  domain: string;
  meta: metaType[];
};

export type Stat = {
  created: number;
  updated: number;
};

export type metaType = {
  property: string;
  content: string;
};
