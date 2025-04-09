import React from 'react';
import { MarketProductData } from '@/apis/Meta/Market/type';
import { cartProductListAtom } from '@/common/stores';
import { useAtom } from 'jotai';
import uniqBy from 'lodash/uniqBy';
import { MouseEvent, useEffect, useState } from 'react';

const useCartFullScreenModal = (
  productList: MarketProductData[] | null,
  onRequestClose: any,
) => {
  const [cartProductList, setCartProductList] = useAtom(cartProductListAtom);
  const [productNum, setProductNum] = useState(0);

  useEffect(() => {
    const newList: MarketProductData[] = uniqBy(productList, '_id');
    setCartProductList(newList);
  }, [productList]);

  useEffect(() => {
    setProductNum(cartProductList.length);
  }, [cartProductList]);

  const handleClose = React.useCallback((e: MouseEvent<HTMLButtonElement>) => {
    onRequestClose(e);
  }, []);

  return { productNum, handleClose };
};
export default useCartFullScreenModal;
