import { SelectHTMLAttributes } from 'react';

export type SelectCoreProps = SelectHTMLAttributes<HTMLSelectElement>;

const SelectCore = (props: SelectCoreProps) => {
  return <select {...props} />;
};

export default SelectCore;
