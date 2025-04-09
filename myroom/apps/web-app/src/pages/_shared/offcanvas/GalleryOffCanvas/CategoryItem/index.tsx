import CustomButton from "@/components/Buttons/CustomButton";
import { Category } from ".."
import classNames from "classnames";
import styles from './styles.module.scss';
import Text from '@/components/Text';
import Icon from "@/components/Icon";
import ToolTip from "@/pages/_shared/ui/ToolTip";
import { useCallback, useState } from "react";

type CategoryItemProps = {
    item: Category;
    currentCategory?: string;
    handleClickCategory: (id: string) => void;
}

const CategoryItem = ({ item, currentCategory, handleClickCategory }: CategoryItemProps) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClickOpenTooltip = useCallback((e: any) => { 
        e.stopPropagation();
        setShowTooltip(true); 
    }, []);

    const handleClickCloseTooltip = useCallback(() => { 
        setShowTooltip(false); 
    }, []);

    return <CustomButton key={item.id} onClick={() => handleClickCategory(item.id)}>
        <div className={classNames(styles['cate-item'], { [styles['selected']]: currentCategory === item.id })}>
            <div>
                <Text text={item.textId} />
                {item.descId && <CustomButton className={styles["info"]} onClick={handleClickOpenTooltip}>
                    <Icon name="Info" />
                </CustomButton>}
                {showTooltip && <ToolTip shape={'lt'} showClose className={styles["tooltip"]} handleClose={handleClickCloseTooltip}>
                    <Text text={item.descId} />
                    </ToolTip>}
            </div>
        </div> 
    </CustomButton>
}

export default CategoryItem;