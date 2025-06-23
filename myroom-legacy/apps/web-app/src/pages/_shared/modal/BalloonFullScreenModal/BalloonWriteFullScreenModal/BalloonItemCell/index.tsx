import Icon from '@/components/Icon';
import style from './style.module.scss';
import { EPriceType } from 'client-core';
import { getPriceIcon } from '@/pages/_shared/popup/GoodsPopup';
import Image from '@/components/Image';
import { ItemData } from '@/apis/Meta/Item/type';
import CustomButton from '@/components/Buttons/CustomButton';
import useBalloonItemTable from '../../Hooks/useBalloonItemTable';
import Text from '@/components/Text';

const BalloonItemCell = ({
  className,
  selectedId,
  data,
  handleClick,
}: {
  className: string;
  selectedId: string;
  data: ItemData;
  handleClick: (id: string) => void;
}) => {
  const { letterBG } = useBalloonItemTable(data._id);

  const onClick = () => {
    handleClick(data._id);
  };
  const Price = () => {
    return (
      <div className={style.priceWrapper}>
        {data.option.price.type == EPriceType.FREE ? null : (
          <div className={style.priceIcon}>
            <Icon name={getPriceIcon(data.option.price.type)} />
          </div>
        )}
        <span className={style.price}>
          {data.option.price.type == EPriceType.FREE ? (
            <Text locale={{ textId: 'GMY.000046' }} />
          ) : (
            data.option.price.amount.toLocaleString()
          )}
        </span>
      </div>
    );
  };

  return (
    <CustomButton
      className={`${className} ${style.wrapper} ${
        selectedId == data._id ? style.selected : ''
      }`}
      onClick={onClick}
      style={{ backgroundColor: `${letterBG}` }}
    >
      <div className={style.icon}>
        <Image src={data.resource.thumbnail} />
      </div>
      {<Price />}
    </CustomButton>
  );
};
export default BalloonItemCell;
