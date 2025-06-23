import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import { t } from 'i18next';
import classNames from 'classnames';

type TabButtonProps = {
    id: number;
    nameId: string;
    selected: boolean;
    onTouch: (id: number) => void;
};

const TabButton = ({ id, nameId, selected, onTouch }: TabButtonProps) => {
    return (
        <div className={classNames(style.body, selected ? style.selected : null)} onClick={() => { onTouch(id); }}>
            <div className={classNames(style.text, selected ? style.selected : null)}>
                <Text locale={{ textId: nameId }} />
            </div>
        </div>
    );
}

export default TabButton;