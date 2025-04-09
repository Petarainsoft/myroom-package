import useScrapAPI from '@/apis/User/Scrap';
import { ScrapFoldersResponse } from '@/apis/User/Scrap/type';
import { useCallback, useEffect, useState } from 'react';

const findFolderId = (folderRes: ScrapFoldersResponse, folderName: string) => {
  for (let i = 0; i < folderRes.data.list.length; ++i) {
    const folderId = folderRes.data.list[i];
    if (
      folderRes.data.set[folderId] &&
      folderRes.data.set[folderId].name === folderName
    ) {
      return folderId;
    }
  }
  return '';
};

const useScrapFolder = (folderName: string, folderType: string) => {
  const {
    fetchScrapFoldersMe,
    fetchScrapFolderContents,
    mutationCreateScrapFoldersMe,
    mutationPutScrapFolderContent,
  } = useScrapAPI();
  const { data: folderRes } = fetchScrapFoldersMe();
  const [folderId, setFolderId] = useState<string>('');
  const { data: contentsRes } = fetchScrapFolderContents(folderId);
  const contentsIds = useState<string[]>(contentsRes?.list ?? []);

  useEffect(() => {
    if (!folderRes || !folderRes.data.set) {
      return;
    }
    setFolderId(findFolderId(folderRes, folderName));
  }, [folderRes]);

  const handleAddScrapContents = useCallback(
    async (content_id: string) => {
      if (!folderId) {
        const res = await mutationCreateScrapFoldersMe.mutateAsync({
          data: { name: folderName, type: folderType },
        });
        if (res) {
          setFolderId(findFolderId(res, folderName));
        } else {
          console.log('folder create failed. ', res);
        }
      }
      const res = await mutationPutScrapFolderContent.mutateAsync({
        folder_id: folderId,
        content_id: content_id,
      });
      if (res) {
        console.log('put contents success. ', res);
      } else {
        console.log('put contents failed. ', res);
      }
    },
    [folderId],
  );

  return { contentsIds, handleAddScrapContents };
};
export default useScrapFolder;
