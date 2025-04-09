import CustomButton from "@/components/Buttons/CustomButton";
import useSearchItemCard from "./hooks";
import styles from './styles.module.scss';
import classNames from "classnames";
import Currency from "../../Currency";
import { nFormatter } from "@/common/utils/string-format";
import Skeleton from "@/components/Skeleton";



type SearchItemCardProps = {
    itemId: string;
    onAfterClick?: () => void;
    className?: string;
}

const SearchItemCard = ({ itemId, className, onAfterClick }:SearchItemCardProps) => {
    const {itemData, isItemLoading, handleClick } = useSearchItemCard(itemId, onAfterClick);
        
    return (
        <CustomButton  className={classNames(styles['wrap'], className)} key={itemId} onClick={handleClick}>
             <Skeleton isLoading={isItemLoading}>
                <div className={styles['thumnail-box']}>
                    <div className={styles['thumnail']} style={{ backgroundImage: `url('${itemData?.data.resource.thumbnail}')` }}></div>
                </div>
            </Skeleton>
            <div className={styles['price']}>
                <Skeleton isLoading={isItemLoading} flex>
                    {itemData?.data?.option?.price?.type && <Currency type={itemData?.data?.option?.price?.type} className={styles['icon']} />}
                    {nFormatter(itemData?.data.option.price.amount)}
                </Skeleton>
            </div>
        </CustomButton>
    )
}

export default SearchItemCard;