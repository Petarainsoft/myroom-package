import useCart from "@/common/hooks/Cart";
import { useCallback } from "react";




const useSavePurchaseButton = () => {

    const { cartProductList, showCartModal } = useCart();
    
    const handleOpenCart = useCallback(() => { 
        if (cartProductList.length > 0) {
            showCartModal();
        }
            
    }, [showCartModal, cartProductList]);
    
    return {cartProductList, handleOpenCart}
}

export default useSavePurchaseButton;