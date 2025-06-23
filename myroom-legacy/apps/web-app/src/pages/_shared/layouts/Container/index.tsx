import { HTMLAttributes, forwardRef } from 'react';
import style from './style.module.scss';
import classNames from 'classnames';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};
const Container = forwardRef<HTMLInputElement, ContainerProps>((props, ref) => {
  const {className, children, ...rest } = props;

  return (
    <div className={classNames(style['container'], className)} {...rest} ref={ref}>
      {children}
    </div>
  );
});

export default Container;
