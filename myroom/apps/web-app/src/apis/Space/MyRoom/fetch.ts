import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  MyRoomData,
  MyRoomTemplateData,
  MyRoomDataResponse,
  MyRoomListResponse,
  CreateMyRoomData,
} from './type';
import { CommonResponse } from '@/apis/_common/type';

/**
 *
 * @param instance
 * @param data
 * @returns
 */
export async function postMyrooms(
  instance: RequestInstance,
  data: CreateMyRoomData,
) {
  return await onRequest<CommonResponse>(instance, `/v1/space/myrooms`, {
    method: 'POST',
    data,
    headers: {
      accept: ' application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 *
 * @param instance
 * @param myroomId
 * @param data
 * @returns
 */
export async function patchMyroom(
  instance: RequestInstance,
  myroomId: string,
  data: MyRoomData,
) {
  return await onRequest<CommonResponse>(
    instance,
    `/v1/space/myrooms/${myroomId}`,
    {
      method: 'PATCH',
      data,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @param myroomId
 * @returns
 */
export async function getMyroom(instance: RequestInstance, myroomId?: string) {
  return await onRequest<MyRoomDataResponse>(
    instance,
    `/v1/space/myrooms/${myroomId}`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @returns
 */
export async function getMyroomsMe(instance: RequestInstance) {
  const isDevMode = true; 
  if (isDevMode) {
    const mockData: MyRoomListResponse = {
      list: [
        {
          _id: '1',
          profile_id: 'mock_profile',
          txt: {
            title: 'Mock Title',
            desc: 'Mock Desc',
            hashtag: ['mock', 'test'],
          },
          resource: {
            manifest: 'mock_manifest',
            image: ['mock_image1'],
            video: [],
            thumbnail: 'mock_thumb',
          },
          option: {
            version: 1,
            avatar: [],
            item: [],
          },
          stat: {
            created: Date.now(),
            updated: Date.now(),
          },
        },
      ],
    };
    return mockData;
  }
  
  return await onRequest<MyRoomListResponse>(
    instance,
    `/v1/space/profiles/me/myrooms`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
const fakeMyRoomData: MyRoomData = {
  format: {
    version: "1.0",
    layout: "grid"
  },
  main: {
    roomId: "room_456789",
    backgroundColor: "#FFFFFF",
    roomSkinId: "skin_classic_01"
  },
  txt: {
    title: "Phòng của tôi"
  },
  option: {
    preset: "cozy-modern"
  },
  manifest: {
    objects: [
      { id: "chair_01", type: "furniture", position: [1, 0, 2] },
      { id: "table_01", type: "furniture", position: [2, 0, 3] }
    ],
    environment: {
      lighting: "soft",
      ambient: "#FAFAFA"
    }
  } as unknown as JSON, // cast tạm nếu manifest là kiểu cụ thể hơn JSON
  resource: {
    thumbnail: "https://cdn.example.com/rooms/room_456789/thumbnail.jpg",
    image: [
      "https://cdn.example.com/rooms/room_456789/img1.jpg",
      "https://cdn.example.com/rooms/room_456789/img2.jpg"
    ],
    video: [
      "https://cdn.example.com/rooms/room_456789/preview.mp4"
    ]
  }
};
/**
 *
 * @param instance
 * @param myroomId
 * @param version
 * @returns
 */
export async function getMyroomManifest(
  instance: RequestInstance,
  myroomId?: string,
  version?: number,
) {
  return fakeMyRoomData;
  return await onRequest<MyRoomData>(
    instance,
    `/v1/space/myrooms/${myroomId}/${version}/manifest`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @param myroomId
 * @param data
 * @returns
 */
export async function postMyroomTemplates(
  instance: RequestInstance,
  myroomId: string,
  data: MyRoomTemplateData,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates`,
    {
      method: 'POST',
      data,
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @returns
 */
export async function getMyroomTemplates(
  instance: RequestInstance,
  myroomId?: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @param myroomId
 * @param data
 * @returns
 */
export async function delMyroomTemplate(
  instance: RequestInstance,
  myroomId: string,
  templateId: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates/${templateId}`,
    {
      method: 'DELETE',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 *
 * @param instance
 * @param myroomId
 * @param templateId
 * @returns
 */
export async function getMyroomTemplateManifest(
  instance: RequestInstance,
  myroomId: string,
  templateId: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/space/myrooms/${myroomId}/templates/${templateId}/manifest`,
    {
      method: 'GET',
      headers: {
        accept: ' application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}
