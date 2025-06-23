import React from 'react';
import ImageCore, { IImageCoreProps } from '../_core/ImageCore';
import Skeleton from '../_core/SkeletonCore';

export type ImageProps = IImageCoreProps & {
  isLoading?: boolean;
};

const Image = ({ isLoading = false, ...rest }: ImageProps) => {
  return (
    <React.Fragment>
      {isLoading ? <Skeleton /> : <ImageCore {...rest} />}
    </React.Fragment>
  );
};

export default Image;
