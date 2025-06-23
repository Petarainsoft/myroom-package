import { Modal, ModalProps } from '@/components/_core/ModalCore';
import Text from '@/components/Text';
import style from './styles.module.scss';
import Icon from '@/components/Icon';

import Button from '@/components/Buttons/Button';
import Header from './Header';
import Cart from './ProductList';
import { MarketProductData } from '@/apis/Meta/Market/type';
import useCartFullScreenModal from './hooks';

interface ICartFullScreenModalProps extends Omit<ModalProps, 'onRequestClose'> {
  productList: MarketProductData[];
  onProductDelete: (ids: string[]) => void;
  onProductBuy: (ids: string[]) => void;
}

const CartFullScreenModal = ({
  productList,
  onProductDelete,
  onProductBuy,
  onRequestClose,
}: ICartFullScreenModalProps) => {
  const { productNum, handleClose } = useCartFullScreenModal(
    productList,
    onRequestClose,
  );
  const EmptyCart = (): React.ReactElement => {
    return (
      <div className={style.emptyCartWrapper}>
        <Icon name="Allim_Empty1" />
        <span>
          <Text
            locale={{ textId: 'GMY.000125' }}
            defaultValue="구매 목록이 비어 있습니다!"
          />
        </span>

        <Button
          className={style.closeButton}
          onClick={handleClose}
          shape="rect"
          size="full"
        >
          <Text
            locale={{ textId: 'GMY.000126' }}
            defaultValue="꾸미기 계속하기"
          />
        </Button>
      </div>
    );
  };

  return (
    <Modal isOpen={true}>
      <div className={style.background}>
        <div className={style.headerWrapper}>
          <Header handleClose={handleClose} />
        </div>
        {productNum > 0 ? (
          <div className={style.cartWrapper}>
            <Cart
              onProductDelete={onProductDelete}
              onProductBuy={onProductBuy}
              handleClose={handleClose}
            />
          </div>
        ) : (
          EmptyCart()
        )}
      </div>
    </Modal>
  );
};
export default CartFullScreenModal;
