import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import { t } from 'i18next';
import Image from '@/components/Image';

type ListItemProps = {
    id: string;
    thumbnail: string;
    onTouch: (id: string) => void;
};

const ListItem = ({ id, thumbnail, onTouch }: ListItemProps) => {
    return (
        <div className={style.body} onClick={() => onTouch(id)}>
            <Image src={thumbnail} className={style.icon} />
        </div>
    );
}

export default ListItem;