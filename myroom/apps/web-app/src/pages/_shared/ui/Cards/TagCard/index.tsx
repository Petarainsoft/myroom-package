import Icon from '@/components/Icon';
import styles from './styles.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import React, { useMemo } from 'react';
import useModal from '@/common/hooks/Modal/useModal';
import Text from '@/components/Text';
import classNames from 'classnames';

type TagCardProps = {
    hashtag: string;
    htCode: string;
    itemCount?: number;
    pingCount?: number;
    className?: string;
}


const TagCard = ({ hashtag, htCode, itemCount = 0, pingCount = 0, className}:TagCardProps) => {
    const tagFullScreenModal = useModal('TagFullScreenModal');

    const hasPing = useMemo(() : boolean => { 
        return pingCount > 0;
    }, [pingCount]);

    const hasItem = useMemo(()  : boolean => { 
        return itemCount > 0;
    }, [itemCount]);

    const handleClick = React.useCallback(() => {
        tagFullScreenModal.createModal({ htCode, hashtag, itemCount, pingCount });
     }, [hashtag, htCode, itemCount, pingCount, tagFullScreenModal]);

    return <CustomButton className={classNames(styles['wrap'], className)} key={htCode} onClick={handleClick}>
        <div className={styles['icon-box']}>
            <Icon name='Tag_S' badge={{isActive: false}}/>
        </div>
        <div className={styles['info-box']}>
            <div className={styles['name']}>
                #{hashtag}
            </div>
            <div className={styles['count']}>
                {hasPing && <React.Fragment>
                    <Text locale={{ textId: "GCM.000006"}} />
                    {pingCount}
                </React.Fragment>}
                {hasPing && hasItem && "."}
                {hasItem && <React.Fragment>
                    <Text locale={{ textId: "GCM.000011"}} />
                    {itemCount}
                </React.Fragment>}
            </div>
        </div>
    </CustomButton>
}

export default TagCard;