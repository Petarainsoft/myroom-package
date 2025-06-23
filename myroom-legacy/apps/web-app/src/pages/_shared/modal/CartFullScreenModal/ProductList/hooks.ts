import React from 'react'
import { useAtom } from "jotai";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { MarketProductData, MarketPurchaseData, PriceData } from "@/apis/Meta/Market/type";
import useMarketAPI from "@/apis/Meta/Market";
import { EPriceType } from "client-core";
// import usePopup from "@/common/hooks/Popup/usePopup";
import { cartProductListAtom, cartUncheckedProductIdsAtom } from "@/common/stores";
import { logger } from "@/common/utils/logger";
import usePopup from "@/common/hooks/Popup/usePopup";


const useProductList = (onProductDelete: (ids: string[]) => void, onProductBuy: (ids: string[]) => void, handleClose: any) => {
  const [uncheckedProductIdMap, setUncheckedProductIdMap] = useAtom(cartUncheckedProductIdsAtom);
  const { mutationPostPurchase } = useMarketAPI();
  const [cartProductList, setCartProductList] = useAtom(cartProductListAtom);
  const [selectedNum, setSelectedNum] = useState(0);
  const [totalPriceMap, setPriceMap] = useState<PriceData[]>();
  const {showAlertPopup, showGoodsPopup} = usePopup();
  // const { showGoodsPopup } = usePopup();
  
  useEffect(() => {
    const newPriceMap: PriceData[] = [];
    const selectedProducts = cartProductList.filter(data => !uncheckedProductIdMap[data._id]);
    selectedProducts.map(data => {
      if (data.option.price.type != EPriceType.FREE) {
        if (!newPriceMap[data.option.price.type])
          newPriceMap[data.option.price.type] = { type: data.option.price.type, amount: 0 };
        newPriceMap[data.option.price.type].amount += data.option.price.amount;
      }
    });
    setPriceMap(newPriceMap);
    setSelectedNum(selectedProducts.length);
  }, [cartProductList, uncheckedProductIdMap])
  // handler -----------------------------------------------------------------------------//
  /**
   * 전체 선택
   * @param e 
   */
  const handleChangeSelectAll = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newMap: Record<string, boolean> = { ...uncheckedProductIdMap };
    cartProductList.map(data => {
      newMap[data._id] = !e.currentTarget.checked;
    });
    setUncheckedProductIdMap(newMap);
  }, [cartProductList, uncheckedProductIdMap]);
  /**
   * 개별 아이템 선택
   * @param e 
   */
  const handleChangeSelectOneItem = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newMap: Record<string, boolean> = { ...uncheckedProductIdMap };
    const productId = e.currentTarget.value;
    newMap[productId] = !e.currentTarget.checked;
    setUncheckedProductIdMap(newMap);
  }, [uncheckedProductIdMap]);
  /**
   * 선택된 아이템 삭제
   */
  const handleDeleteSelectedProducts = React.useCallback(() => {
    const unselectedList = cartProductList.filter(data => uncheckedProductIdMap[data._id]);
    const deleteProductIds = cartProductList.filter(data => !uncheckedProductIdMap[data._id]).map(data => data._id);
    const newUncheckedProductIdMap: Record<string, boolean> = { ...uncheckedProductIdMap };
    deleteProductIds.map(productId => { newUncheckedProductIdMap[productId] = false; })
    
    setCartProductList(unselectedList);
    setUncheckedProductIdMap(newUncheckedProductIdMap);
    onProductDelete(deleteProductIds);
  }, [cartProductList, uncheckedProductIdMap, onProductDelete]);
  
  /**
   * 개별 아이템 삭제
   * @param e 
   */
  const handleDeleteProduct = React.useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const newList: MarketProductData[] = [...cartProductList];
    const newUncheckedProductIdMap: Record<string, boolean> = { ...uncheckedProductIdMap };
    const productId = e.currentTarget.value;
    const findIndex = newList.findIndex(data => data._id === e.currentTarget.value);
    if (findIndex > -1) {
      newList.splice(findIndex, 1);
      newUncheckedProductIdMap[productId] = false;
      onProductDelete([productId]);
      setUncheckedProductIdMap(newUncheckedProductIdMap);
      setCartProductList(newList);
    }
  },[cartProductList, uncheckedProductIdMap, onProductDelete]);
  // const canBuy = (priceData: PriceData) => {
  //   console.log(priceData)
  //   // TODO : check price.
  //   showGoodsPopup({
  //     priceType: EPriceType.HARDCURRENCY,
  //     contentText: "부족하다 부족해",
  //   });
  // }
  /**
   * 구매 버튼 클릭
   */
  const handleBuy = React.useCallback(async () => {
    console.log("handleBuy - selectedNum : " + selectedNum);
    if (selectedNum <= 0) {
      return;
    }

    let purchaseData: MarketPurchaseData = {
      products: [],
      total_price: []
    }
    const selectedProducts = cartProductList.filter(data => !uncheckedProductIdMap[data._id]);
    selectedProducts.map(data => {
      purchaseData.products.push({ product_id: data._id });
      const priceIndex = purchaseData.total_price.findIndex(priceData => priceData.type === data.option.price.type);
      if (priceIndex <= -1) {
        purchaseData.total_price.push({ type: data.option.price.type, amount: data.option.price.amount });
      }
      else {
        purchaseData.total_price[priceIndex].amount += data.option.price.amount;
      }
    });
    // TODO : 재화 체크. 
    // TODO : 보유중인 아이템 체크.

    const res = await mutationPostPurchase.mutateAsync({ data: purchaseData });
    if (!res || res.error) {
      showAlertPopup({titleText:`마켓 구매 실패\n(${res?.error_desc ?? res?.error ?? 'API ERROR'})`});
    }
    else {
      const boughtIds = res.data.product.map((data=>data.id));
      onProductBuy(boughtIds);
      handleClose();
    }
  }, [selectedNum, cartProductList, uncheckedProductIdMap]);

  return { cartProductList, uncheckedProductIdMap, selectedNum, totalPriceMap, handleChangeSelectAll, handleChangeSelectOneItem, handleDeleteSelectedProducts, handleDeleteProduct, handleBuy };
};
export default useProductList;