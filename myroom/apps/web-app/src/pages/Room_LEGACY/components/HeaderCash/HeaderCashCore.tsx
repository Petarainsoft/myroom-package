import { useState } from 'react';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';
import { ICashCore } from '../Cash/CashCore';

const HeaderCashCore = ({ diamond, cube }: ICashCore) => {
  const [isCashClosed, setIsCashClosed] = useState(false);
  const handleCashOpen = () => {
    setIsCashClosed((prev) => !prev);
  };
  //애니메이션 없는 Cash Component => <Cash/>
  return (
    <div
      onClick={handleCashOpen}
      className={`${style.headerCashWrapper} ${
        isCashClosed ? style.isClosed : ''
      }`}
    >
      <motion.div layout transition={move}>
        <div className={`${style.cashWrapper} ${style.firstCashWrapper}`}>
          <div className={`${style.iconWrapper} ${style.diamond}`}>
            <Icon name="Money_Diamond_SS" />
          </div>
          <div className={style.cash}>{diamond}</div>
        </div>
      </motion.div>
      <motion.div layout transition={move}>
        <div className={style.cashWrapper}>
          <div className={`${style.iconWrapper} ${style.cube}`}>
            <Icon name="Money_Cube_SS" />
          </div>
          <div className={style.cash}>{cube}</div>
          {/* <div>{hardCurrency.toLocaleString()}</div> */}
        </div>
      </motion.div>
      <motion.div layout transition={move}>
        <div className={`${style.iconWrapper} ${style.arrow}`}>
          <Icon name={isCashClosed ? `Arrow_Right_One_SS` : `Arrow_Left_One_SS`} />
        </div>
      </motion.div>
    </div>
  );
};

const move = {
  type: 'spring',
  stiffness: 600,
  damping: 30,
};

export default HeaderCashCore;
