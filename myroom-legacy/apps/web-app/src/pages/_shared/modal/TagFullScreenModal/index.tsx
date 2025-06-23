import { Modal, ModalProps } from "@/components/_core/ModalCore";
import View from "@/pages/_shared/layouts/View";
import useTagFullScreenModal from "./hooks";
import Switcher from "@/pages/_shared/layouts/Switcher";
import styles from './styles.module.scss';
import Icon from "@/components/Icon";
import Item from "./Item";
import Ping from "./Ping";
import Tabs from "@/pages/_shared/layouts/Tabs";
import { useMemo } from "react";
import React from "react";
import Text from "@/components/Text";
import Container from "../../layouts/Container";
interface ITagFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
    htCode: string;
    hashtag: string;
    itemCount?: number;
    pingCount?: number;
}

const TagFullScreenModal = ({ hashtag, htCode, pingCount = 0, itemCount = 0  }: ITagFullScreenModal) => { 

    const { tagStatus, handleClickClose, handleClickTab } = useTagFullScreenModal();

    const hasPing = useMemo(() => { 
        return pingCount > 0;
    }, [pingCount]);

    const hasItem = useMemo(() => { 
        return itemCount > 0;
    }, [itemCount]);

    return <Modal isOpen={true} className={styles['wrap']} >
        <View className={styles['container']} disableNavigation
            headerOptions={{
                closeOptions: {
                    onClick: handleClickClose,
                    icon: 'arrow',
                }
            }}>
            <Container className={styles['info-box']}>
                <div className={styles['icon']}>
                    <Icon name="Tag_M" badge={{isActive: false}} />
                </div>
                <div>
                    <div className={styles['name']}>
                        #{hashtag}
                    </div>
                    <div className={styles['count']}>
   
                        {hasPing && hasItem && "."}

                        {hasItem && <React.Fragment>
                            <Text locale={{ textId: "GCM.000011"}} />
                            {itemCount}
                        </React.Fragment>}
                    </div>
                </div>
            </Container>
            <Tabs elements={[
                { textId: "GCM.000006", onClick: () => handleClickTab('PING'), selected: tagStatus === 'PING', icon: "Pings_S" },
                { textId: "GCM.000011", onClick: () => handleClickTab('ITEM'), selected: tagStatus === 'ITEM', icon: "Itembox_S" },
            ]} />
            <Container className={styles['contents-wrap']}>
                <Switcher status={tagStatus} elements={[{ status: 'PING', element: <Ping /> }, { status: "ITEM", element: <Item htCode={htCode} /> }]} />
            </Container>
        </View>
    </Modal>

}

export default TagFullScreenModal;