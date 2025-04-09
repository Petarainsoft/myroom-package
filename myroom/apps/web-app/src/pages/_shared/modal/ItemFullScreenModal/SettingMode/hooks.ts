import { useCallback, useRef, useState } from 'react';
import { LinkType } from '../type';
import { SceneManager } from '@/common/utils/client';
import useModal from '@/common/hooks/Modal/useModal';
import useResourceAPI from '@/apis/Resource';
import { IMyRoomItemFunctionData } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom';
import { EMediaType } from 'client-core/assetSystem/definitions';
import usePopup from '@/common/hooks/Popup/usePopup';

const useSettingMode = () => {
  const ImageCropEditModal = useModal('ImageCropEditModal');
  const { showToastPopup } = usePopup();

  const { mutationPostResourceImage } = useResourceAPI();
  const [linkType, setLinkType] = useState<LinkType>('link');
  const [showLinkSetting, setShowLinkSetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   *
   */
  const handleClickCloseLinkSetting = useCallback(() => {
    setShowLinkSetting(false);
  }, []);

  /**
   *
   */
  const handleClickOpenLinkSetting = useCallback((type: LinkType) => {
    setShowLinkSetting(true);
    setLinkType(type);
  }, []);

  /**
   *
   */
  const handleClickOpenImageSetting = useCallback(
    (e: any) => {
      e.preventDefault();

      if (fileRef) {
        console.log('handleImage');
        fileRef.current?.click();
      }
    },
    [fileRef],
  );

  /**
   * 이미지 변경시 서버에 업로드후 아이템에 반영
   */
  const handleChangeImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget?.files;
      if (files) {
        const file = files[0];

        ImageCropEditModal.createModal({
          file,
          onComplete: async (file: File) => {
            const res = await mutationPostResourceImage.mutateAsync({
              data: { images: file },
              params: {},
            });

            if (res && res.list && res.list.length > 0) {
              SceneManager.Item?.getItemController((controller) => {
                const funcData = controller?.getItemFunctionData();

                const data: IMyRoomItemFunctionData = {
                  linkUrl: funcData?.linkUrl ? funcData?.linkUrl : '',
                  linkAlias: funcData?.linkAlias ? funcData?.linkAlias : '',
                  instanceId: funcData?.instanceId ? funcData?.instanceId : '',
                  functionData: `${res.list[0].path.cdn}.png`,
                  mediaType: EMediaType.Image,
                };

                if (data) {
                  SceneManager.Item?.doItemFunction(data);
                }

                showToastPopup({ titleText: '#적용되었습니다.' });
              });
            }
          },
        });
      }
    },
    [ImageCropEditModal, mutationPostResourceImage, showToastPopup],
  );

  return {
    fileRef,
    linkType,
    showLinkSetting,
    handleClickCloseLinkSetting,
    handleClickOpenLinkSetting,
    handleClickOpenImageSetting,
    handleChangeImage
  };
};

export default useSettingMode;
