import React from "react";
import SkeletonCore, { SkeltonCoreProps } from "../_core/SkeletonCore";
import classNames from "classnames";
import styles from "./styles.module.scss";
export type SkeletonProps = SkeltonCoreProps & {
    isLoading?: boolean;
    children?: React.ReactNode;
    flex?: boolean;
};

const Skeleton = ({ isLoading, children, height="100%", flex = false, containerClassName, ...rest}: SkeletonProps) => {
    return <React.Fragment>
        {isLoading ? <SkeletonCore containerClassName={classNames(containerClassName, {[styles['flex']]: flex})} height={height} {...rest} /> : children
}
    </React.Fragment>
}

export default Skeleton;

