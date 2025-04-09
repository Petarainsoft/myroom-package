import style from './style.module.scss';
import { t } from 'i18next';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Header from './Header';
import Tab from './Tab';
import ListBody from './ListBody';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import View from '@/pages/_shared/layouts/View';

interface JoysamModelListProps extends Omit<ModalProps, 'onRequestClose'> {

}

const JoysamModelListModal = ({ onRequestClose }: JoysamModelListProps) => {

    return (
        <Modal
            isOpen={true}
            className={style.modal}
        >
            <View
                disableNavigation={true}
            >
                <div className={style.body}>
                    <Header onClose={onRequestClose} />
                    <div className={style.body2}>
                        <div className={style.inner_body}>
                            <Tab />
                            <ListBody />
                        </div>
                    </div>
                </div>
            </View>
        </Modal>
    );
};

export default JoysamModelListModal;
