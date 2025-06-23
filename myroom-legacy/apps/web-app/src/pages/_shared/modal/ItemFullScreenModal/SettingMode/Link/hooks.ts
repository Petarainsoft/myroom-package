import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  selectedClientItemAtom
} from '@/common/stores';
import { getYoutubeId, isUrl } from '@/common/utils/string-format';
import { LinkType } from '../../type';
import { EMediaType } from 'client-core';
import usePopup from '@/common/hooks/Popup/usePopup';
import { SceneManager } from '@/common/utils/client';
import { itemFunctionDataAtom } from '../../store';

const useItemLink = (type: LinkType, onClose: () => void) => {
  const [itemFunctionData, setItemFunctionData] = useAtom(itemFunctionDataAtom);
  const [link, setLink] = useState<string>();
  const [alias, setAlias] = useState<string>();
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [linkDisabled, setLinkDisabled] = useState(true);
  const itemClientId = useAtomValue(selectedClientItemAtom);

  const { showToastPopup } = usePopup();

  React.useEffect(() => {
    setLink(itemFunctionData?.linkUrl);
    setAlias(itemFunctionData?.linkAlias);
   }, [itemFunctionData]);

  const handleChangeLink = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLink(e.currentTarget.value);
    if (e.currentTarget.value.length > 0) setLinkDisabled(false);
    else setLinkDisabled(true);
  }, []);

  const handleChangeAlias = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAlias(e.currentTarget.value);
  }, []);

  const handleClickSubmit = useCallback(() => {
    SceneManager.Item?.getItemController((controller) => {
      if (!controller) {
        return;
      }

      let funcData = controller.getItemFunctionData();
      if (!funcData) {
        funcData = {
          instanceId: itemClientId,
        }
      }

      if (type === 'link') {
        funcData.linkUrl = link;
        funcData.linkAlias = alias;
      } else {
        funcData.functionData = link;
        funcData.mediaType = EMediaType.Video;
      }

      
      SceneManager.Item?.doItemFunction(funcData);
      setItemFunctionData(funcData);
      
      showToastPopup({ titleText: '#적용되었습니다.' });

      onClose();
    });
  }, [alias, itemClientId, link, onClose, setItemFunctionData, showToastPopup, type]);

  const handleClickPreview = useCallback(
    (type: 'link' | 'video') => {
      if (type === 'link') {
        // prefix http, https 아닐 경우 relative path 로 적용됨
        if (link && isUrl(link)) {
          console.log('url is valid');
          window.open(link, '_blank');
          //setUiItemDetail(false);
        }
      } else {
        setShowVideoPreview((prev) => !prev);
      }
    },
    [link],
  );

  const videoPreviewUrl = useMemo(() => {
    return link ? `https://www.youtube.com/embed/${getYoutubeId(link)}` : '';
  }, [link]);

  return {
    link,
    alias,
    videoPreviewUrl,
    showVideoPreview,
    linkDisabled,
    handleChangeLink,
    handleChangeAlias,
    handleClickPreview,
    handleClickSubmit,
  };
};

export default useItemLink;
