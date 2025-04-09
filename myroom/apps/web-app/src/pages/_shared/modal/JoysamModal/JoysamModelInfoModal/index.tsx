import style from './style.module.scss';
import { t } from 'i18next';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import React, { useState, useCallback, useMemo } from 'react';
import { logger } from '@/common/utils/logger';
import { TableDataManager, ConstantsEx } from 'client-core';
import Header from './Header';
import CanvasBody from './CanvasBody';
import InfoBody, { NullInfoBody } from './InfoBody';
import useItemAPI from "@/apis/Meta/Item";
import { LANG } from "@/pages/Joysam";
import { tabList } from '../JoysamModelListModal/Tab';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import { getYoutubeId } from '@/common/utils/string-format';
import ListBody from './ListBody';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import View from '@/pages/_shared/layouts/View';

type JoysamModelInfoProps = {
    itemId: string;
    onRequestClose: any;
};

enum ContetntState {
    INIT = 0,
    CANVAS = 1,
    VIDEO = 2,
};

const JoysamModelInfoModal = ({ itemId, onRequestClose }: JoysamModelInfoProps) => {

    const [specificItemId, setSpecificItemId] = useState<string | null>(null);

    const curItemId = specificItemId ?? itemId;
    const itemData = useItemAPI().fetchItem(curItemId).data?.data;

    //console.log("itemData", itemData);

    const [isContentState, setIsContentState] = useState(ContetntState.CANVAS);

    const onShowVideo = useCallback(() => {
        console.log("onShowVideo");
        setIsContentState(ContetntState.VIDEO);
    }, []);
    const onHideVideo = useCallback(() => {
        console.log("onHideVideo");
        setIsContentState(ContetntState.CANVAS);
    }, []);

    const body = useMemo(() => {
        if (!itemData) return null;

        let url = null;
        if (itemData?._id) {
            const itemInfo = TableDataManager.getInstance().findItem(itemData._id);
            if (itemInfo) {
                const youtubeId = getYoutubeId(itemInfo.funtion_address);
                if (youtubeId) {
                    url = 'https://www.youtube.com/embed/' + youtubeId;
                } else {
                    logger.error('invalid youtube url', itemInfo.funtion_address);
                }
            }
        }
        switch (isContentState) {
            case ContetntState.INIT:
                return null;
            case ContetntState.VIDEO:
                {
                    if (url) {
                        return (
                            <>
                                <div className={style.video_area}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={url}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    //allowFullScreen
                                    ></iframe>
                                </div>
                                {/* <CustomButton className={style.canvas_btn} onClick={onHideVideo}>
                                    <Icon name="joysam/To_Canvas_Button" />
                                </CustomButton> */}
                            </>);
                    } else {
                        return (<>
                            <div>
                                <Text text={'no_video'} />
                            </div>
                            {/* <CustomButton className={style.canvas_btn} onClick={onHideVideo}>
                                <Icon name="joysam/To_Canvas_Button" />
                            </CustomButton> */}
                        </>);
                    }
                }
            case ContetntState.CANVAS:
                return (
                    <>
                        <CanvasBody itemId={itemData._id} className={style.canvas} />
                        {/* <CustomButton className={style.canvas_btn} onClick={onShowVideo}>
                            <Icon name="joysam/To_Video_Button" />
                        </CustomButton> */}
                    </>);
        }
    }, [itemData, isContentState]);

    const tabData = React.useMemo(() => {
        const system_hashtag = itemData?.txt.system_hashtag;
        if (system_hashtag) {
            return tabList.find((tab) => {
                if (tab.hashTags.length > 1) return false;
                return system_hashtag.includes(tab.hashTags[0]);
            });
        } else {
            return null;
        }

    }, [itemData]);

    const backColor = tabData?.color;
    const gradeColor = tabData?.gradeColor;
    const categoryNameId = tabData?.nameId ?? 'none';
    const buttonPath = isContentState === ContetntState.VIDEO ? 'joysam/To_Canvas_Button' : 'joysam/To_Video_Button';
    const buttonClick = isContentState === ContetntState.VIDEO ? onHideVideo : onShowVideo;

    const onTouchBuy = useCallback(() => {
        console.log("onTouchBuy", itemData?._id);
        if (itemData?._id) {
            const itemInfo = TableDataManager.getInstance().findItem(itemData._id);
            if (itemInfo) {
                window.open(itemInfo.link_address, '_blank');
            } else {
                logger.error("no item info", itemData._id);
            }
        }
    }, [itemData]);

    const onTouchItem = useCallback((id: string) => {
        console.log("onTouchItem", id);
        setSpecificItemId(id);
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
                    <Header onClose={onRequestClose} />
                    <div className={style.body2}>
                        <div className={style.inner_body}>
                            <div className={style.content}>
                                {body}
                            </div>
                            {itemData ? (<InfoBody
                                id={itemId}
                                name={itemData.txt.title ? itemData.txt.title[LANG] : ""}
                                desc={itemData.txt.desc ? itemData.txt.desc[LANG] : ""}
                                thumbnail={itemData.resource.thumbnail}
                                backColor={backColor}
                                gradeColor={gradeColor}
                                categoryNameId={categoryNameId}
                                onTouchBuy={onTouchBuy}
                                buttonPath={buttonPath}
                                buttonClick={buttonClick}
                            />) : (<NullInfoBody />)}
                            <ListBody onTouchItem={onTouchItem} />
                        </div>
                    </div>
                </div>
            </View>
        </Modal>
    );
};

export default JoysamModelInfoModal;
