/** 20231012 MyRoomData 백업 */
// export type MyRoomData = {
//   main?: any;
//   txt?: {
//     title: string;
//   };
//   manifest: JSON;
//   resource?: {
//     thumbnail?: string;
//     image: string[];
//     video: string[];
//   };
// };

export type CreateMyRoomData = {
  txt: {
    title: string;
  };
  manifest: JSON;
  option: {
    preset: string;
  };
};

export type MyRoomData = {
  format?: any;
  main?: any;
  txt?: {
    title: string;
  };
  option?: {
    preset: string;
  };
  manifest?: JSON;
  resource?: {
    thumbnail?: string;
    image?: string[];
    video?: string[];
  };
};

export type MyRoom = {
  _id: string;
  profile_id: string;
  txt: {
    title: string;
    desc: string;
    hashtag: string[];
  };
  resource: {
    manifest: string;
    image: string[];
    video: string[];
    thumbnail: string;
  };
  option: {
    version: number;
    avatar: string[];
    item: string[];
  };
  stat: {
    created: number;
    updated: number;
  };
};

export type MyRoomDataResponse = {
  data: MyRoom;
};

export type MyRoomListResponse = {
  list: MyRoom[];
};

export type MyRoomTemplateData = {
  manifest: any;
  resource: {
    thumbnail: string;
  };
};
