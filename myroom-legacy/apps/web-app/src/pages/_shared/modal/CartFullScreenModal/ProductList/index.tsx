import style from './styles.module.scss';
import Item from './Item';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';

import Button from '@/components/Buttons/Button';
import useProductList from './hooks';
import { getPriceIcon } from '@/pages/_shared/popup/GoodsPopup';
import { EItemCategory1 } from 'client-core';
import IconCheckBox from '@/components/Forms/CheckBox/IconCheckBox';

const Cart = ({
  onProductDelete,
  onProductBuy,
  handleClose,
}: {
  onProductDelete: (ids: string[]) => void;
  onProductBuy: (ids: string[]) => void;
  handleClose: any;
}) => {
  const {
    cartProductList,
    uncheckedProductIdMap,
    selectedNum,
    totalPriceMap,
    handleChangeSelectAll,
    handleChangeSelectOneItem,
    handleDeleteSelectedProducts,
    handleDeleteProduct,
    handleBuy,
  } = useProductList(onProductDelete, onProductBuy, handleClose);

  const CategoryLine = ({
    categoryName,
  }: {
    categoryName: string;
  }): React.ReactElement => {
    return (
      <div className={style.category}>
        <h2>{categoryName}</h2>
      </div>
    );
  };
  const Price = ({
    iconName,
    value,
  }: {
    iconName: string;
    value: string;
  }): React.ReactElement => {
    return (
      <div className={style.priceWrapper}>
        <div className={style.priceIcon}>
          <Icon name={iconName} />
        </div>
        <Text text={value} />
      </div>
    );
  };

  const TotalPrice = (): React.ReactElement => {
    return (
      <div className={style.totalPriceWrapper}>
        <span>
          <Text locale={{ textId: 'GMY.000124' }} />
        </span>
        <div className={style.pricesWrapper}>{printPriceMap()}</div>
      </div>
    );
  };
  /**
   * 하단 가격 합계 출력.
   * @returns
   */
  const printPriceMap = () => {
    if (!totalPriceMap || totalPriceMap.length <= 0)
      return (
        <span className={`${style.secondaryColor} ${style.bold}`}>
          <Text locale={{ textId: 'GMY.000068' }} />
        </span>
      );
    const result: JSX.Element[] = [];
    totalPriceMap.map((priceData) => {
      result.push(
        <Price
          key={priceData.type}
          iconName={getPriceIcon(priceData.type)}
          value={priceData.amount.toLocaleString()}
        />,
      );
    });

    return result;
  };
  /**
   * 상품 리스트 출력.
   * @returns
   */
  const printProductMap = () => {
    const result: JSX.Element[] = [];
    // 표시되는 category 순서.
    for (const index in EItemCategory1) {
      const category = EItemCategory1[index];
      const list = cartProductList.filter(
        (data:any) => data.option.category[0] === category,
      );
      if (list.length > 0) {
        result.push(
          <CategoryLine
            key={category}
            categoryName={`${category} (${list.length})`}
          />,
        );
        list.map((data) => {
          result.push(
            <Item
              key={data._id}
              data={data}
              checked={!uncheckedProductIdMap[data._id]}
              handleChangeSelect={handleChangeSelectOneItem}
              handleDelete={handleDeleteProduct}
            />,
          );
        });
      }
    }
    return result;
  };

  return (
    <div className={style.wrapper}>
      <header className={style.header}>
        <IconCheckBox
          className={style.allSelectCheckBox}
          onChange={handleChangeSelectAll}
          checked={selectedNum == cartProductList.length}
        >
          <span className={style.childWrapper}>
            <span>
              <Text
                locale={{ textId: 'GMY.000119' }}
                defaultValue="전체 선택"
              />
            </span>
            <span className={selectedNum > 0 ? style.secondaryColor : ''}>
              {selectedNum}
            </span>
            <span>/{cartProductList.length}</span>
          </span>
        </IconCheckBox>

        <CustomButton
          onClick={handleDeleteSelectedProducts}
          className={`${style.delButton} ${
            selectedNum > 0 ? style.secondaryColor : ''
          }`}
        >
          선택 삭제
        </CustomButton>
      </header>

      <main
        className={`${style.cartListWrapper} ${
          selectedNum > 0 ? style.hasTotalPrice : ''
        }`}
      >
        {printProductMap()}
      </main>

      {selectedNum > 0 ? <TotalPrice /> : null}

      <Button
        onClick={handleBuy}
        shape="rect"
        size="full"
        variant="primary"
        className={style.buyButton}
        disabled={selectedNum <= 0}
      >
        <span>
          <Text locale={{ textId: 'GMY.000123' }} defaultValue="구매하기" />
        </span>
        <span
          className={selectedNum > 0 ? style.secondaryColor : ''}
        >{`(${selectedNum})`}</span>
      </Button>
    </div>
  );
};
export default Cart;
