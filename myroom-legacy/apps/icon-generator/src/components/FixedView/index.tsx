import React from 'react';
import classNames from 'classnames';
import style from './style.module.scss';
import Container from '../Container';

type headerOptions = {
  disabled?: boolean;
  element?: React.ReactNode;
}

type FixedViewProps = {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  disableNavigation?: boolean;
  headerOptions?: headerOptions;
};

const FixedView = ({
  children,
  className,
  headerOptions,
  disableNavigation = false,
}: FixedViewProps) => {
  return (
    <React.Fragment>
      {!headerOptions?.disabled && <Container className={style['header']}>{headerOptions?.element}</Container>}
      <main
        className={classNames(className, style['fix-view'], {
          [`${style['navigation']}`]: !disableNavigation,
        })}
      >
        {children}
      </main>
    </React.Fragment>
  );
};

export default FixedView;
