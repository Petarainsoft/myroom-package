import CustomButton from '@/components/Buttons/CustomButton';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import classNames from 'classnames';
import { motion } from 'framer-motion';

const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30,
};

type TEditMode = 'MY' | 'MARKET';
export interface IMarketToggleButton {
  onClickToggle: () => void;
  editMode: TEditMode;
}

const MarketToggleButton = ({
  onClickToggle,
  editMode,
}: IMarketToggleButton) => {
  return (
    <CustomButton className={style.my_market} onClick={onClickToggle}>
      <motion.div layout layoutRoot>
        <div
          className={classNames(style.toggleMyMarketContainer, {
            [style.toggleEnd]: editMode === 'MARKET',
          })}
        >
          <div className={classNames(style.categoryIcon, style.my)}>
            <Icon name={`Category_My`} />
          </div>
          <div className={classNames(style.categoryIcon, style.market)}>
            <Icon name={`Category_Shop_M`} />
          </div>
          <motion.div className={style.toggleBtn} layout transition={spring} />
        </div>
      </motion.div>
    </CustomButton>
  );
};

export default MarketToggleButton;
