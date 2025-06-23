import { useAtomValue } from 'jotai';
import { goodsPopupAtom } from '@/common/stores';
import PopupCore from '@/components/_core/PopupCore';
import useGoodsPopup from '@/common/hooks/Popup/useGoodsPopup';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import Button from '@/components/Buttons/Button';
import { EPriceType } from 'client-core';
import Text from '@/components/Text';

export const getPriceIcon = (priceType: EPriceType) => {
  switch (priceType) {
    case EPriceType.SOFTCURRENCY:
      return 'Money_Cube_SS';
    case EPriceType.HARDCURRENCY:
      return 'Money_Diamond_SS';
  }
  return '';
};

const GoodsPopup = () => {
  const goodsPopupData = useAtomValue(goodsPopupAtom);
  const { isOpen, handleConfirm, handleCancel } = useGoodsPopup();
  const getTitleTextCode = (goodsType: EPriceType) => {
    switch (goodsType) {
      case EPriceType.SOFTCURRENCY:
        return 'GMY.000134';
      case EPriceType.HARDCURRENCY:
        return 'GMY.000130';
    }
    return '';
  };
  const getContentTextCode = (goodsType: EPriceType) => {
    switch (goodsType) {
      case EPriceType.SOFTCURRENCY:
        return 'GMY.000135';
      case EPriceType.HARDCURRENCY:
        return 'GMY.000131';
    }
    return '';
  };
  return goodsPopupData ? (
    <PopupCore isOpen={isOpen} style={{ overlay: { zIndex: 51 } }}>
      <div className={style.background}>
        <div className={style.goodsIcon}>
          <Icon name={getPriceIcon(goodsPopupData.priceType)} />
        </div>

        <div className={style.title}>
          {
            <Text
              locale={{ textId: getTitleTextCode(goodsPopupData.priceType) }}
            />
          }
        </div>

        <div className={style.content}>
          {!goodsPopupData.contentText || goodsPopupData.contentText == '' ? (
            <Text
              locale={{ textId: getContentTextCode(goodsPopupData.priceType) }}
            />
          ) : (
            goodsPopupData.contentText
          )}

          <div className={style.buttonWrapper}>
            <Button variant="none" size="l" onClick={handleCancel}>
              {goodsPopupData.cancelText ?? (
                <Text locale={{ textId: 'GCM.000033' }} />
              )}
            </Button>
            <Button onClick={handleConfirm} size="l">
              {goodsPopupData.confirmText ?? (
                <Text locale={{ textId: 'GMY.000132' }} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </PopupCore>
  ) : null;
};

export default GoodsPopup;
