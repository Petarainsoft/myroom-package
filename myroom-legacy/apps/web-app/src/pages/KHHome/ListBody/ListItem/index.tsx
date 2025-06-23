import style from './style.module.scss';
import Text from '@/components/Text';
import Image from '@/components/Image';

type ListItemProps = {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    categoryName: string;
    backColor?: string;
    gradeColor?: string;
    onTouch: (id: string) => void;
};

const ListItem = ({ id, name, desc, thumbnail, categoryName, backColor, gradeColor, onTouch }: ListItemProps) => {
    return (
        <div className={style.body} onClick={() => onTouch(id)} style={{ backgroundColor: backColor ?? '#fff' }}>
            <div className={style.grade_mark} style={{ backgroundColor: gradeColor }}>
                <div className={style.text}>
                    <Text text={categoryName} />
                </div>
            </div>
            <div className={style.title}>
                <Text text={name} />
            </div>
            <div className={style.material_desc}>
                <Text text={desc} />
            </div>
            <div className={style.icon}>
                <Image src={thumbnail} />
            </div>
        </div>
    );
}

export default ListItem;