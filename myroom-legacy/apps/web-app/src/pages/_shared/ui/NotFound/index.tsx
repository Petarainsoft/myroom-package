
import Icon from '@/components/Icon';
import styles from './styles.module.scss';
import Text from '@/components/Text';
import Button from '@/components/Buttons/Button';

export type NotFoundProps = {
    icon?: string;
    textId?: string;
    action?: {
        onClick: () => void;
        textId: string;
        /** 버튼에 들어갈 아이콘 */
        icon?: string;
    }
}

const NotFound = ({ icon, textId, action}:NotFoundProps) => { 
    return <div className={styles['wrap']}>
        <div className={styles['container']}>
            {icon && <div className={styles['icon-box']}>
                <Icon name={icon} />
            </div>}
            <div className={styles['text']}>
                <Text locale={{ textId: textId ?? "GMY.000187" }} hasTag/>
            </div>
            {action && <Button className={styles['button']} size='l' variant='primary' onClick={action.onClick}>
                <Text locale={{ textId: action.textId }} />
                </Button>}
        </div>
    </div>
}

export default NotFound;