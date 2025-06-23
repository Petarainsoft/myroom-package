import { forwardRef } from 'react';
import InputCore, { InputCoreProps } from '../../_core/InputCore';
import styles from './styles.module.scss';

export type InputTextProps = InputCoreProps;

const InputFile = forwardRef<HTMLInputElement, InputTextProps>((props, ref) => {
  return (
    <InputCore
      className={styles['file']}
      ref={ref}
      type={'file'}
      {...props}
    ></InputCore>
  );
});

export default InputFile;
