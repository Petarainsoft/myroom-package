import { HTMLAttributes } from 'react';
import style from './style.module.scss';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};
const Container = ({ children, className, ...rest }: ContainerProps) => {
  return (
    <div className={`${style['container']} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Container;
