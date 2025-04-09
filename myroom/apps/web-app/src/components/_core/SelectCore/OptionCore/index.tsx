import { OptionHTMLAttributes } from 'react';

export type OptionCoreProps = OptionHTMLAttributes<HTMLOptionElement>;

const OptionCore = (props: OptionCoreProps) => {
  return <option {...props} />;
};

export default OptionCore;
