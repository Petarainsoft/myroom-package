import ButtonCore, { ButtonCoreProps } from '@/components/_core/ButtonCore';
import classNames from 'classnames';
import styles from './styles.module.scss';

/**
 * 
 */
export type CircleButtonProps = ButtonCoreProps & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'black' | 'defualt' | 'none';
  shape?: 'circle' | 'circle-bl' | 'circle-br' | 'none';
  size: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'xxxl';
  loading?: boolean;
  border?: "white" | 'none';
  badge?: {
    variant: 'black' | "none";
    count: number
  };
};

/**
 * 
 * @param CircleButtonProps 
 * @returns 
 */
const CircleButton = ({
  children,
  shape = 'circle',
  variant = 'defualt',
  border = 'none',
  size,
  badge,
  style,
  ...rest
}: CircleButtonProps) => {
  return (
    <ButtonCore {...rest}>
      <div
        style={style}
        className={classNames(styles['wrap'], styles[size], {
          [styles[shape]]: shape !== 'none',
          [styles[variant]]: variant !== 'none',
          [styles[`border-${border}`]]: border !== 'none',
        })}
      >
        {children}
        {(badge && badge.count > 0) && <div className={classNames(styles['badge'], {[styles[badge.variant]]: badge.variant !== 'none'})}>
          {badge.count > 99? '99+' : badge.count}
        </div>}
      </div>
    </ButtonCore>
  );
};

export default CircleButton;
