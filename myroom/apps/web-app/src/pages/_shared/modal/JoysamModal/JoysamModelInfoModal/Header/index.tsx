import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';

type HeaderProps = {
    onClose: any;
};

const Header = ({ onClose }: HeaderProps) => {
    return (
        <div className={style.header}>
            <CustomButton className={style.close_button} onClick={onClose}>
                {/* //TODO: custom -> circle */}
                <Icon name="Top_Close" />
            </CustomButton>
        </div>
    );
}

export default Header;