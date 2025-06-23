import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import { t } from 'i18next';
import Image from '@/components/Image';
import joysamText from '@/assets/joysam.json';

type ListItemProps = {
    id: string;
    name: string;
    thumbnail: string;
    categoryNameId: string;
    backColor?: string;
    gradeColor?: string;
    onTouch: (id: string) => void;
};

const ListItem = ({ id, name, thumbnail, categoryNameId, backColor, gradeColor, onTouch }: ListItemProps) => {
    return (
        <div className={style['body']} onClick={() => onTouch(id)} style={{ backgroundColor: backColor ?? '#fff' }}>
            <div className={style.grade_mark} style={{ backgroundColor: gradeColor }}>
                <div className={style.text}>
                    <Text locale={{ textId: categoryNameId }} />
                </div>
            </div>
            <div className={style.title}>
                <Text text={name} />
            </div>
            <div className={style.material_desc}>
                <Text text={joysamText["JOY.000002"]} />
            </div>
            <div className={style.icon}>
                <Image src={thumbnail} />
            </div>
        </div>
    );
}

export default ListItem;