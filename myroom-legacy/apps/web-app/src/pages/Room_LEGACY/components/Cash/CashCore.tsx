import Icon from '@/components/Icon';
import style from './style.module.scss';
export interface ICashCore {
  diamond: string;
  cube: string;
}
const CashCore = ({ diamond, cube }: ICashCore) => {
  return (
    <div className={style.CashCoreWrapper}>
      <div className={`${style.cashWrapper} ${style.firstCashWrapper}`}>
        <div className={style.iconWrapper}>
          <Icon name="Money_Diamond_SS" />
        </div>
        <div className={style.cashText}>{diamond}</div>
      </div>
      <div className={style.cashWrapper}>
        <div className={style.iconWrapper}>
          <Icon name="Money_Cube_SS" />
        </div>
        <div className={style.cashText}>{cube}</div>
        {/* <div>{hardCurrency.toLocaleString()}</div> */}
      </div>
    </div>
  );
};

export default CashCore;
