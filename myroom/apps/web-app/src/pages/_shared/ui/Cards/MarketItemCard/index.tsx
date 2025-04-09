import CustomButton from "@/components/Buttons/CustomButton";
import Icon from "@/components/Icon";
import Skeleton from "@/components/Skeleton";
import { useCallback, useMemo } from "react";
import styles from "./styles.module.scss";
import classNames from "classnames";
import Text from '@/components/Text';
import { nFormatter } from "@/common/utils/string-format";
import useCart from "@/common/hooks/Cart";
import useMarketAPI from "@/apis/Meta/Market";
import useReactionAPI from "@/apis/Social/Reaction";
import useItemAPI from "@/apis/Meta/Item";
import { EPriceType } from "client-core";
import useItemMemoAPI from "@/apis/Social/ItemMemo";
import useRoom from "@/common/hooks/use-room";
import usePopup from "@/common/hooks/Popup/usePopup";
import { t } from "i18next";


export type MarketItemCardCardProps = {
    id: string;
    instanceId?: string;
    hasFunction?: boolean;
    selected?: boolean;
    onClick?: () => void;
    disabledLiked?: boolean;
}

const MarketItemCard = ({ id, instanceId, selected, hasFunction, disabledLiked, onClick }: MarketItemCardCardProps) => {
    const {showToastPopup } = usePopup();
    const { currentRoomInfo } = useRoom();
    const { cartProductList, setCartProductList } = useCart();
    const { fetchProduct } = useMarketAPI();
    const { fetchMyReaction, mutationPostReaction } = useReactionAPI();
    const { fetchMeItem } = useItemAPI();
    const { fetchItemMemos } = useItemMemoAPI();
    
    const { data: productData, isLoading : isProductLoading } = fetchProduct(id);
    const { data: reactionData, isLoading: isReactionLoading } = fetchMyReaction(id);
    const { data: userItemData, isLoading: isUserItemLoading } = fetchMeItem(id);


    const { data: memoData } = fetchItemMemos({
        profile_id: instanceId? currentRoomInfo?.ownerId : undefined,
        myroom_id: instanceId? currentRoomInfo?.id : undefined,
        item_instance_id: instanceId,
    });

    const itemMemo = useMemo(()=>{
        return memoData && memoData.list.length > 0? memoData.list[0].txt.contents : undefined;
      },[memoData]);

    const itemPrice = useMemo(() => { 
        return productData?.data?.option?.price?.amount?? 0;
    }, [productData]);

    const itemPriceType = useMemo(() => {
        return productData?.data?.option?.price?.type;
     }, [productData]);
    

    const isOwn = useMemo(() => { 
        if (itemPriceType === EPriceType.NOTFORSALE) {
            return true;
        }
        else {
            return userItemData?.data?.option?.quantity ? userItemData?.data?.option?.quantity > 0  : false;
        }
    }, [itemPriceType, userItemData]);

    const liked = useMemo(() => {
        if (!disabledLiked && reactionData?.data?.stat?.reaction?.like) {
            return reactionData?.data?.stat?.reaction?.like > 0;
        }
        else {
            return false;
        }
    }, [reactionData, disabledLiked]);

    const handleLongPress = useCallback(async () => {
        if (disabledLiked) {
            return;
        }
        
        if (id) {
            await mutationPostReaction.mutateAsync({
                id,
                params: {
                    origin_profile_id: productData?.data?.profile_id? productData?.data?.profile_id : '',
                    reaction:'like',
            } });    
        }
     }, [id, mutationPostReaction, productData, disabledLiked]);

     const isLoading = useMemo(() => { 
        return isProductLoading || isReactionLoading || isUserItemLoading;
    }, [isProductLoading, isReactionLoading, isUserItemLoading]);

    const handleClick = useCallback(() => { 
        if (onClick) {
            onClick();
        }

        if (!isOwn && productData && itemPriceType !== EPriceType.FREE) {
            const cartItem = cartProductList.find((item) => item?._id === productData?.data?._id);
            if (!cartItem) {
                setCartProductList(prev => [...prev, productData?.data]);
                showToastPopup({ titleText: t("GMY.000090") });
            }
        }
    }, [cartProductList, isOwn, itemPriceType, onClick, productData, setCartProductList, showToastPopup]);


    return <CustomButton key={id} onClick={handleClick} onLongPress={handleLongPress}>
        <div className={classNames(styles['wrap'], {[styles['selected']]:selected})}>
            <div className={styles['thumnail']} style={{ backgroundImage: `url('${productData?.data?.resource?.thumbnail}')` }}>
                <Skeleton isLoading={isLoading}>
                    {liked && <div className={styles['like']}><Icon name="Bookmark_S_On" /></div>}
                </Skeleton>

                {(hasFunction || itemMemo)&& <Icon className={styles['balloon']} name="Link_Memo_Balloon_M" />}
            </div>
            
            <Skeleton isLoading={isLoading} className={styles['info']}>
                <div className={classNames(styles['info'], {[styles['own']]: isOwn} )}>
                    {isOwn ? <Text locale={{ textId: "GMY.000077" }} /> : 
                        itemPriceType === EPriceType.FREE ? <Text locale={{ textId: "GMY.000068" }} /> :
                            <div className={styles['price']}>
                                <Icon name={itemPriceType === 3 ? 'Money_Cube_SS' : 'Money_Diamond_SS'} /> {nFormatter(itemPrice)}
                            </div>
                    }
                </div>
            </Skeleton>
        </div>
    </CustomButton>
}

export default MarketItemCard;
