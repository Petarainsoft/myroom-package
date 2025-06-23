import style from './style.module.scss';
import { t } from 'i18next';
import Text from '@/components/Text';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import CanvasBody from '../JoysamModelInfoModal/CanvasBody';
import React, { useState, useCallback, useMemo } from 'react';
import joysamText from '@/assets/joysam.json';
import useModal from '@/common/hooks/Modal/useModal';
import { logger } from '@/common/utils/logger';
import { TableDataManager, ConstantsEx } from 'client-core';
import View from '@/pages/_shared/layouts/View';

interface JoysamItemDetailProps extends Omit<ModalProps, 'onRequestClose'> {
    itemId: string;
}

const JoysamItemDetailModal = ({ itemId, onRequestClose }: JoysamItemDetailProps) => {

    const JoysamModelListModal = useModal('JoysamModelListModal');

    const itemData = TableDataManager.getInstance().findItem(itemId);
    const hasOnlyLink = itemData?.link_address && !itemData?.funtion_address;

    const onLink1 = useCallback(() => {
        console.log("onLink1", itemData?.link_address);
        if (itemData?.link_address) window.open(itemData?.link_address, '_blank');
    }, []);

    const onLink2 = useCallback(() => {
        console.log("onLink2", itemData?.funtion_address);
        if (itemData?.funtion_address) window.open(itemData?.funtion_address, '_blank');
    }, []);

    const onShowList = useCallback(() => {
        console.log("onShowList");
        // 닫고 띄워야, list에서 3d canvas를 띄울수 있다.
        onRequestClose();
        JoysamModelListModal.createModal({
        });
    }, []);

    return (
        <Modal
            isOpen={true}
            className={style.modal}
        >
            <View
                disableNavigation={true}
            >
                <div className={style.body}>
                    <div className={style.inner_body}>
                        <CanvasBody itemId={itemId} className={style.canvas} />
                        {hasOnlyLink && (
                            <CustomButton className={style.list_button} onClick={onLink1}>
                                <div className={style.text}>
                                    <Text text={joysamText['JOY.000001']} />
                                </div>
                            </CustomButton>
                        )}
                        {!hasOnlyLink && (
                            <div className={style.button_area}>
                                <CustomButton className={style.link_button} onClick={onLink1}>
                                    <Icon name="joysam/Instagram" />
                                </CustomButton>
                                <CustomButton className={style.link_button} onClick={onLink2}>
                                    <Icon name="joysam/Youtube" />
                                </CustomButton>
                            </div>
                        )}
                    </div>
                    <CustomButton className={style.close_button} onClick={onRequestClose}>
                        <Icon name="joysam/Header_Close" />
                    </CustomButton>
                </div>
            </View>
        </Modal>
    );
};

export default JoysamItemDetailModal;
