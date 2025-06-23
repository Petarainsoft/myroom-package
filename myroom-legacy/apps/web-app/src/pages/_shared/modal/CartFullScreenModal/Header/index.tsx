import CustomButton from '@/components/Buttons/CustomButton';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import style from './style.module.scss';
import Cash from '@/pages/Room_LEGACY/components/Cash';

const Header = ({ handleClose }: { handleClose: any }) => {
  return (
    <header className={style.wrapper}>
      <CustomButton className={style.backButton} onClick={handleClose}>
        <Icon name="Top_Arrow_left_M" />
      </CustomButton>
      <Text locale={{ textId: 'GMY.000076' }} defaultValue='구매'/>
      <ul className={style.headerAlignRight}>
        <Cash />
      </ul>
    </header>
  );
};
export default Header;
