import React from 'react';
import SkeletonCore, { SkeltonCoreProps } from '../_core/SkeletonCore';
import TextCore, { TextCoreProps } from '../_core/TextCore';

export type TextProps = TextCoreProps & {
  isLoading?: boolean;
  skeletonOption?: SkeltonCoreProps;
};

const Text = ({ isLoading = false, skeletonOption, ...rest }: TextProps) => {
  return (
    <React.Fragment>
      {isLoading ? (
        <SkeletonCore {...skeletonOption} />
      ) : (
        <TextCore {...rest} />
      )}
    </React.Fragment>
  );
};

export default Text;
