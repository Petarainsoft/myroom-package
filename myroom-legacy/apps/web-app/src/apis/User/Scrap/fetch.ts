import onRequest, { RequestInstance } from '@/common/utils/fetch';
import {
  PostScrapFoldersData,
  ScrapFoldersContentsResponse,
  ScrapFoldersResponse,
} from './type';

export async function getScrapFoldersMe(instance: RequestInstance) {
  return await onRequest<ScrapFoldersResponse>(
    instance,
    `/v1/user/profiles/me/scrap/folders`,
    {
      method: 'GET',
    },
  );
}
export async function postScrapFoldersMe(
  instance: RequestInstance,
  data: PostScrapFoldersData,
) {
  return await onRequest<ScrapFoldersResponse>(
    instance,
    `/v1/user/profiles/me/scrap/folders`,
    {
      method: 'POST',
      data,
    },
  );
}
export async function getScrapFoldersWhere(
  instance: RequestInstance,
  content_id: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/scrap/folders/_/contents/${content_id}`,
    { method: 'GET' },
  );
}
export async function modifyScrapFoldersMe(
  instance: RequestInstance,
  data: PostScrapFoldersData,
) {
  return await onRequest<any>(instance, `/v1/user/profiles/me/scrap/folders`, {
    method: 'POST',
    data,
  });
}
export async function deleteScrapFoldersMe(
  instance: RequestInstance,
  folder_id: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/scrap/folders/${folder_id}`,
    { method: 'DELETE' },
  );
}

export async function getScrapFolderContents(
  instance: RequestInstance,
  folder_id: string,
) {
  return await onRequest<ScrapFoldersContentsResponse>(
    instance,
    `/v1/user/profiles/me/scrap/folders/${folder_id}/contents`,
    { method: 'GET' },
  );
}

export async function putScrapFolderContent(
  instance: RequestInstance,
  folder_id: string,
  content_id: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/scrap/folders/${folder_id}/contents/${content_id}`,
    { method: 'PUT' },
  );
}

export async function deleteScrapFolderContent(
  instance: RequestInstance,
  folder_id: string,
  content_id: string,
) {
  return await onRequest<any>(
    instance,
    `/v1/user/profiles/me/scrap/folders/${folder_id}/contents/${content_id}`,
    { method: 'DELETE' },
  );
}
