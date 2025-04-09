import { mainLinkPreviewUIlAtom } from '@/common/stores';
import LinkPreviewOffCanvas from '@/pages/_shared/offcanvas/LinkPreviewOffCanvas';
import { useAtom } from 'jotai';
import React, { useCallback } from 'react';

const LinkPreview = () => {
  const [mainLinkPreviewUI, setMainLinkPreviewUI] = useAtom(
    mainLinkPreviewUIlAtom,
  );

  const handleCloseLinkPreview = useCallback(() => {
    setMainLinkPreviewUI((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      setMainLinkPreviewUI((prev) => ({ ...prev, url: '' }));
    }, 200);
  }, [setMainLinkPreviewUI]);
  return (
    <div>
      {mainLinkPreviewUI.url && (
        <LinkPreviewOffCanvas
          isOpen={mainLinkPreviewUI.isOpen}
          onClose={handleCloseLinkPreview}
          url={mainLinkPreviewUI.url}
        />
      )}
    </div>
  );
};

export default LinkPreview;
