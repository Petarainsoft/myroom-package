import useResourceAPI from '@/apis/Resource';
import { MyRoomAPI } from 'client-core';
import { useCallback } from 'react';

const useThumbnail = () => {
  const { mutationPostResourceImage } = useResourceAPI();

  const base64ToFile = useCallback((dataurl: string, fileName: string) => {
    const arr = dataurl.split(',');
    if (!arr) {
      return;
    }

    const mimeArr = arr[0].match(/:(.*?);/);
    if (!mimeArr) {
      return;
    }

    const mime = mimeArr[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
  }, []);

  const createThumbnail = useCallback(
    (inst?: MyRoomAPI, callback?: (id: string) => Promise<void>) => {
      console.log('create ss ', inst);
      if (!inst) {
        return;
      }

      inst.createScreenShot(256, async (data: string) => {
        const file = base64ToFile(data, 'screenshot.png');
        if (!file) {
          return;
        }

        const res = await mutationPostResourceImage.mutateAsync({
          data: { images: file },
          params: {},
        });
        if (res && res.list && res.list.length > 0) {
          if (callback) callback(res.list[0]._id);
        }
      });
    },
    [base64ToFile, mutationPostResourceImage],
  );

  const createThumbnailBase64Data = useCallback(
    (inst?: MyRoomAPI, size?:number, callback?: (data: string) => void) => {
      if (!inst) {
        return;
      }
      if(!size){
        size=256;
      }
      inst.createScreenShot(size, (data: string) => {
        callback?.(data);
      });
    },
    [],
  );

  const urlToThumbnail = useCallback(
    async (url: string): Promise<string | null> => {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'thumnail', { type: 'image/png' });

      const res = await mutationPostResourceImage.mutateAsync({
        data: { images: file },
        params: {},
      });
      if (res && res.list && res.list.length > 0) {
        return res.list[0]._id;
      }

      return null;
    },
    [mutationPostResourceImage],
  );

  return { createThumbnail, createThumbnailBase64Data, urlToThumbnail, base64ToFile };
};

export default useThumbnail;
