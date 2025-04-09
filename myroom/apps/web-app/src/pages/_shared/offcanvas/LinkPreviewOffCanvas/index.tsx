import React from 'react';
import OffCanvas from '../../layouts/Offcanvas';
import './style.scss';
import Button from '@/components/Buttons/Button';
import Image from '@/components/Image';
import useLinkAPI from '@/apis/Resource/Link';
import Text from '@/components/Text';

export interface ILinkPreviewOffCanvas {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const LinkPreviewOffCanvas = ({
  isOpen,
  onClose,
  url,
}: ILinkPreviewOffCanvas) => {
  const encodedURL = encodeURIComponent(url);
  const { fetchLink } = useLinkAPI();
  const { data: linkData } = fetchLink(isOpen ? encodedURL : undefined);
  console.log('linkData', linkData);
  if (!linkData) return;

  const meta = linkData?.data?.option?.meta || null;
  const getMetaContent = (property: string) => {
    const item = meta?.find((m) => m.property === property);
    return item ? item.content : null;
  };

  const image = getMetaContent('og:image');
  const title = getMetaContent('og:title');
  const description = getMetaContent('og:description');
  const urlInfo = linkData?.data?.url;

  return (
    <OffCanvas
      isOpen={isOpen}
      onClose={onClose}
      variant={'primary'}
      headerOptions={{
        disableClose: true,
        customElement: (
          <div className="linkPreviewHeader">
            <Text
              locale={{ textId: 'GMY.000147' }}
              defaultValue="‘브라우저에서 열기’ 버튼을 눌러 링크를 확인하세요."
              hasTag
            />
          </div>
        ),
      }}
      offCanvasClassName={'linkPreviewOffCanvas'}
    >
      <div className="linkContentWrapper">
        <div className={'urlThumbnail'}>
          <Image src={image!} />
        </div>
        <div className="linkContentInfo">
          <div className="url">{urlInfo! || url}</div>
          <div className="siteName">{title! || url}</div>
          <div className="title">{description! || ''}</div>
        </div>
      </div>
      <div className="bottomButtons">
        <Button size="bottom_m" onClick={onClose} variant='default'>
          <Text locale={{ textId: 'GCM.000033' }} defaultValue="닫기" />
        </Button>

        <Button size="bottom_m">
          <a href={urlInfo || url} target="_blank">
            <Text
              locale={{ textId: 'GMY.000148' }}
              defaultValue="브라우저에서 열기"
            />
          </a>
        </Button>
      </div>
    </OffCanvas>
  );
};

export default LinkPreviewOffCanvas;
