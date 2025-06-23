import useCash from './useCash';
import { comma } from '@/common/utils/string-format';
import CashCore from './CashCore';

const Cash = () => {
  const { softCurrency, hardCurrency } = useCash();
  return <CashCore diamond={comma(softCurrency)} cube={comma(hardCurrency)} />;
};

export default Cash;
