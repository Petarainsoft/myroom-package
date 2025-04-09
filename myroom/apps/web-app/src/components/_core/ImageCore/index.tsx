import React from 'react';
import { BASE_IMG_URL } from '@/common/constants';

export type ImageCoreProps = React.ImgHTMLAttributes<HTMLImageElement>;
export type IImageCoreProps = ImageCoreProps & {
  name?: string;
  baseUrl?: string;
};

const ImageCore = ({ name, src, ...rest }: IImageCoreProps) => {
  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.src = '/icons/placeholder-item.svg';
    },
    [src],
  );

  if (src) {
    return <img src={src} {...rest} onError={handleError} />;
  } else {
    return <img src={`${BASE_IMG_URL}/${name}`} {...rest} onError={handleError} />;
  }
};

export default ImageCore;