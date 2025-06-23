import { HTMLAttributes, forwardRef } from "react";
import Header, { HeaderProps } from "./Header";
import classNames from "classnames";
import styles from "./styles.module.scss";
import Navigation from "./Navigation";

type ViewProps = HTMLAttributes<HTMLDivElement> & {
    fixed?: boolean;
    headerOptions?: HeaderProps;
    disableHeader?: boolean;
    disableNavigation?: boolean;
}

const View = forwardRef<HTMLDivElement, ViewProps>((props, ref) => {
    const { children, className, headerOptions, fixed = false, disableNavigation, disableHeader, ...rest } = props;

    return <div className={styles['wrap']}>
        {headerOptions && !disableHeader && !headerOptions.float && <Header  {...headerOptions} />}
        <div {...rest} className={classNames(styles['container'], className, { [`${styles['fixed']}`]: fixed })} ref={ref}>
            {children}
        </div>
        {headerOptions && !disableHeader && headerOptions.float && <Header  {...headerOptions} />}
        <Navigation isOpen={!disableNavigation} />
    </div>
});

export default View;