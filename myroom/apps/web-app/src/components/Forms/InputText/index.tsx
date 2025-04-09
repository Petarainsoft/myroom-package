import classNames from 'classnames';
import InputCore, { InputCoreProps } from '../../_core/InputCore';
import style from './style.module.scss';
import { forwardRef } from 'react';

export type InputTextProps = InputCoreProps & {
  type: 'text' | 'password';
  variant?: 'default' | 'fail';
};

const InputText = forwardRef<HTMLInputElement, InputTextProps>((props, ref) => {
  const { className , variant = 'default', type, ...rest} = props;

  return (
    <InputCore
      className={classNames(style['input-text'], className, {[style[variant]] : variant !== 'default'})}
      type={type}
      ref={ref}
      {...rest}
    ></InputCore>
  );
});

export default InputText;
