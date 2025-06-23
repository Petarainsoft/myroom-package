import React from 'react';
import useSavePurchaseButton from './hooks';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';

export type SavePurchaseButtonProps = {
  onSave: () => void;
  id?: string;
};

const SavePurchaseButton = ({ onSave, id }: SavePurchaseButtonProps) => {
  const { cartProductList, handleOpenCart } = useSavePurchaseButton();
  return (
    <React.Fragment>
      {cartProductList?.length > 0 ? (
        <Button
          id={id}
          onClick={handleOpenCart}
          variant="tertiary"
          bagde={cartProductList?.length}
        >
          <Text locale={{ textId: 'GMY.000076' }} />
        </Button>
      ) : (
        <Button id={id} onClick={onSave} variant="tertiary">
          <Text locale={{ textId: 'GCM.000015' }} />
        </Button>
      )}
    </React.Fragment>
  );
};

export default SavePurchaseButton;
