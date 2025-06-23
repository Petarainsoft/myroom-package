import { CommonResponse } from '@/apis/_common/type';

export type PostScrapFoldersData = {
  name: string;
  type: string;
};

export type ScrapFoldersResponse = CommonResponse & {
  data: {
    list: string[];
    set: { [key: string]: ScrapFolderData };
  };
};

export type ScrapFolderData = {
  name: string;
  type: string;
  first: string;
  inven: string;
  invenmax: string;
};

export type ScrapFoldersContentsResponse = CommonResponse & {
  list: string[];
};
