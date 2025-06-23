import { useCallback } from "react";
import useModal from "../Modal/useModal";
import { MarketProductData } from "@/apis/Meta/Market/type";
import { cartProductListAtom } from "@/common/stores";
import { useAtom } from "jotai";




const useCart = () => { 
    const CartFullScreenModal = useModal('CartFullScreenModal');

    const [cartProductList, setCartProductList] = useAtom(cartProductListAtom);

    const onProductBuy = useCallback((ids: string[]) => { 
        setCartProductList(prev => prev.filter(item => !ids.includes(item._id)));
    }, [setCartProductList]);

    const showCartModal = useCallback(() => { 
        CartFullScreenModal.createModal({ productList: cartProductList, onProductBuy });
    }, [CartFullScreenModal, cartProductList, onProductBuy]);

    const addCartItem = useCallback((product: MarketProductData) => { 
        setCartProductList(prev => [...prev, product]);
    }, [setCartProductList]);

    const removeCartItem = useCallback((id:string) => { 
        setCartProductList(prev => prev.filter(item => item._id !== id));
    }, [setCartProductList]);

    const clearCartItem = useCallback(() => { 
        setCartProductList([]);
    }, [setCartProductList]);




    return {cartProductList, showCartModal, addCartItem, removeCartItem, clearCartItem, setCartProductList}
}

export default useCart; 