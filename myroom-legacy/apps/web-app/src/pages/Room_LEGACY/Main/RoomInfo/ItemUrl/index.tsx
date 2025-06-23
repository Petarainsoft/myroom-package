import React, { useEffect } from 'react';
import { SceneManager } from '@/common/utils/client';
import { useAtom } from 'jotai';
import { mainLinkPreviewUIlAtom } from '@/common/stores';
import { EMediaType } from 'client-core';
import BalloonMessage from '@/pages/_shared/ui/BalloonMessage';

import style from './style.module.scss';

interface IItemUrl {
  instanceId: string;
  setIsExistItemInfo: React.Dispatch<React.SetStateAction<boolean>>;
}
const ItemUrl = ({ instanceId, setIsExistItemInfo }: IItemUrl) => {
  const [linkAlias, setLinkAlias] = React.useState<string | undefined>(
    undefined,
  );
  const [linkUrl, setLinkUrl] = React.useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = React.useState<EMediaType | undefined>(
    undefined,
  );
  const [, setMainLinkPreviewUI] = useAtom(mainLinkPreviewUIlAtom);

  const handleOpenLinkPreview = React.useCallback(() => {
    setMainLinkPreviewUI((prev) => ({ ...prev, url: linkUrl! }));
    setTimeout(() => {
      setMainLinkPreviewUI((prev) => ({ ...prev, isOpen: true }));
    }, 200);
  }, [linkUrl]);

  useEffect(() => {
    SceneManager.Room?.findItemController(instanceId, (roomController) => {
      const data = roomController?.getItemFunctionData();
      if (!data) return;

      setLinkAlias(data.linkAlias);
      setLinkUrl(data.linkUrl);
      setMediaType(data.mediaType);

      setIsExistItemInfo(!!data.linkUrl);
    });
  }, []);

  if (!linkUrl) return <></>;
  return (
    <div>
      <BalloonMessage
        url={linkUrl}
        subText={linkAlias}
        urlCallback={handleOpenLinkPreview}
        className={style.relativeDiv}
      />
    </div>
  );
};

export default ItemUrl;
