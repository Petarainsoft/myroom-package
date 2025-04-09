import { Textfit } from 'react-textfit';
import ButtonCore, { ButtonCoreProps } from '../../_core/ButtonCore';
import styles from './styles.module.scss';
import { VariantType } from '@/common/types';
import classNames from 'classnames';
import { useMemo } from 'react';

type ButtonProps = ButtonCoreProps & {
  shape?: 'rect' | 'capsule';
  variant?: VariantType;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl' | 'bottom_m' | 'full';
  isLoading?: boolean;
  bagde?: number;
};

const Button = ({
  className,
  children,
  disabled,
  bagde,
  size = 'm',
  shape = 'capsule',
  variant = 'primary',
  ...rest
}: ButtonProps) => {
  const max = useMemo(() => {
    switch (size) {
      case 'full':
      case 'xl':
        return 16;
      default:
        return 12;
    }
  }, [size]);

  return (
    <ButtonCore
      className={classNames(styles['button'], className, {
        [styles['button-full']]: size === 'full',
      })}
      disabled={disabled}
      {...rest}
    >
      <Textfit
        className={classNames(
          styles['container'],
          styles[variant],
          styles[size],
          styles[shape],
          { [styles['disabled']]: disabled },
        )}
        mode="single"
        max={max}
        forceSingleModeWidth={false}
      >
        {children}
      </Textfit>
      {bagde && <div className={styles['badge']}>{bagde}</div>}
    </ButtonCore>
  );
};

export default Button;
