import Option from './Option';
import SelectCore, { SelectCoreProps } from '../../_core/SelectCore';

export interface SelectProps extends SelectCoreProps {}

const Select = ({ children, ...rest }: SelectProps) => {
  return <SelectCore {...rest}>{children}</SelectCore>;
};
Select.Option = Option;

export default Select;
