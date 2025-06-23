import throttle from 'lodash/throttle';
import { ButtonHTMLAttributes, MouseEvent } from 'react';
import styles from './styles.module.scss';
import React from 'react';
import classNames from 'classnames';
import ReactGA from 'react-ga4';
import { useLongPress } from 'use-long-press';
import { useForm } from 'react-hook-form';

export type ButtonCoreProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onLongPress?: () => void;
  submit?: boolean;
};

const ButtonCore = ({
  children,
  className,
  onClick,
  onLongPress,
  id,
  submit,
  ...rest
}: ButtonCoreProps) => {
  const { register } = useForm();

  const bind = useLongPress(() => {
    if (onLongPress) {
      onLongPress();
    }
  });

  const handleClick = React.useCallback(
    throttle((e: MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      // 임시 주석처리 (GTM 테스트)
      if (id?.includes('ga-')) {
        const action = id.replace(/^ga-/, '');
        ReactGA.event({
          category: 'GA_Button',
          action: action,
        });
      }
    }, 1000),
    [onClick, id],
  );

  return (
    <button
      id={id}
      type={submit ? 'submit' : 'button'}
      className={classNames(styles.button, className)}
      onClick={handleClick}
      {...bind()}
      {...rest}
      {...register(id ?? 'data')}
    >
      {children}
    </button>
  );
};

export default ButtonCore;
