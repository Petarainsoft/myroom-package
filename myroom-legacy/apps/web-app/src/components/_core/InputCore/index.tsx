import { forwardRef } from 'react';
import { InputHTMLAttributes } from 'react';

export type InputCoreProps = InputHTMLAttributes<HTMLInputElement>;

const InputCore = forwardRef<HTMLInputElement, InputCoreProps>((props, ref) => {

  return <input ref={ref} {...props} />;
});

export default InputCore;
