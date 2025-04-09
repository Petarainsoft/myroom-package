import Skeleton, { SkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';


export type SkeltonCoreProps = SkeletonProps;


const SkeletonCore = ({ ...rest }: SkeltonCoreProps) => {
  return <Skeleton {...rest} />;
};

export default SkeletonCore;
