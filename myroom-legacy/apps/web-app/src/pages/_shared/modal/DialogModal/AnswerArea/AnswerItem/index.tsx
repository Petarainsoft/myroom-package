import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import classNames from 'classnames';

type AnswerItemProps = {
    id: string;
    name: string;
    selected: boolean;
    onTouch: (id: string) => void;
};

const AnswerItem = ({ id, name, selected, onTouch }: AnswerItemProps) => {
    return (
        <div className={classNames(style.body, selected ? style.selected : null)} onClick={() => onTouch(id)}>
            <div className={style.text}>
                <Text text={name} />
            </div>
            {selected && (
                <div className={style.selected_mark}>
                    <Icon name="Btn_Check_SS" />
                </div>
            )}
        </div>
    );
}

export default AnswerItem;