import useMarketAPI from "@/apis/Meta/Market";
import useMe from "@/common/hooks/use-me";
import useModal from "@/common/hooks/Modal/useModal";
import { EItemCategory1 } from "client-core";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";




const useSearchItemCard = (itemId: string, onAfterClick?: () => void) => { 
    const { meAvatarId } = useMe();
    const navigate = useNavigate();
    const avatarInfoFullScreenModal = useModal('AvatarInfoFullScreenModal');
    const { fetchProduct } = useMarketAPI();


    const { data : itemData, isLoading: isItemLoading} = fetchProduct(itemId);

    const handleClick = useCallback(() => {
        const rootCategory = itemData?.data.option.category[0];
        switch (rootCategory) {
            case EItemCategory1.AVATAR:
                avatarInfoFullScreenModal.createModal({avatarId: meAvatarId, itemId});
                break;
            case EItemCategory1.MYROOMSKIN:
                navigate(`/rooms/me/place?skinId=${itemId}`);
                break;
            case EItemCategory1.MYROOMITEM:
                navigate(`/rooms/me/place?itemId=${itemId}`);
                break;
        }

        if (onAfterClick) {
            onAfterClick();
        }
       
    }, [avatarInfoFullScreenModal, itemData?.data.option.category, itemId, meAvatarId, navigate, onAfterClick]);

  
    return {itemData, isItemLoading, handleClick}
}

export default useSearchItemCard;