import OptionCore, {
  OptionCoreProps,
} from '../../../_core/SelectCore/OptionCore';

interface OptionProps extends OptionCoreProps {}

const Option = ({ ...rest }: OptionProps) => {
  return <OptionCore {...rest}></OptionCore>;
};

export default Option;
