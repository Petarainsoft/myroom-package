import useCash from '../Cash/useCash';
import { comma } from '@/common/utils/string-format';
import HeaderCashCore from './HeaderCashCore';
const HeaderCash = () => {
  const { softCurrency, hardCurrency } = useCash();
  return (
    <HeaderCashCore diamond={comma(softCurrency)} cube={comma(hardCurrency)} />
  );
};

export default HeaderCash;
