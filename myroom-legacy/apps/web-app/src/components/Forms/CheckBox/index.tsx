import InputCore, { InputCoreProps } from '@/components/_core/InputCore';
import { ChangeEvent } from 'react';

export type CheckBoxProps = InputCoreProps & {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const CheckBox = ({ ...rest }: CheckBoxProps) => {
  return <InputCore type="checkbox" {...rest} />;
};

export default CheckBox;
