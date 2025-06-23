import Image from '@/components/Image';
import style from './styles.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { ChangeEvent, MouseEvent } from 'react';
import { getPriceIcon } from '@/pages/_shared/popup/GoodsPopup';
import { EPriceType } from 'client-core';
import { MarketProductData } from '@/apis/Meta/Market/type';
import Text from '@/components/Text';
import IconCheckBox from '@/components/Forms/CheckBox/IconCheckBox';
const Item = ({
  data,
  checked,
  handleDelete,
  handleChangeSelect,
}: {
  data: MarketProductData;
  checked: boolean;
  handleDelete: (e: MouseEvent<HTMLButtonElement>) => void;
  handleChangeSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className={style.itemWrapper}>
      <IconCheckBox
        className={style.checkBox}
        onChange={handleChangeSelect}
        checked={checked}
        value={data._id}
      ></IconCheckBox>

      <div className={style.thumbnailBox}>
        <Image src={data.resource.thumbnail} />
      </div>

      <div className={style.itemInfo}>
        <span className={style.itemName}>{data.txt.title.ko}</span>
        <div className={style.priceWrapper}>
          {data.option.price.type == EPriceType.FREE ? (
            <span className={style.priceFree}>
              <Text locale={{ textId: 'GMY.000068' }} defaultValue="무료" />
            </span>
          ) : (
            <>
              <Icon name={getPriceIcon(data.option.price.type)} />
              {data.option.price.amount.toLocaleString()}
            </>
          )}
        </div>
      </div>
      <CustomButton
        className={style.delButton}
        onClick={handleDelete}
        value={data._id}
      >
        <Icon name="Close_Bottom_S" />
      </CustomButton>
    </div>
  );
};
export default Item;
