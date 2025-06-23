import Icon from '@/components/Icon';
import Text from '@/components/Text';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import style from './style.module.scss';
import usePopup from '@/common/hooks/Popup/usePopup';
import CustomButton from '@/components/Buttons/CustomButton';

type ItemProps = {
  name: string;
  textId?: string;
  goTo: string;
  selected: boolean;
};
const Item = ({ goTo, name, textId, selected }: ItemProps) => {
  const { showToastPopup } = usePopup();
  const navigate = useNavigate();

  const handleClick = React.useCallback(() => {
    switch (goTo) {
      // 임시 처리
      case '/ping-up':
      case '/pings':
        showToastPopup({ titleText: '준비 중입니다.' });
        break;
      default:
        navigate(goTo);
        break;
    }
  }, [goTo, navigate, showToastPopup]);

  return (
    <CustomButton onClick={handleClick} className={style['item-wrap']}>
      <Icon name={`Bottom_${name}`} badge={{ isActive: selected }} />
    
      <div className={style['txt']}>
        {textId && <Text locale={{ textId }} />}
      </div>
    </CustomButton>
  );
};

export default Item;
