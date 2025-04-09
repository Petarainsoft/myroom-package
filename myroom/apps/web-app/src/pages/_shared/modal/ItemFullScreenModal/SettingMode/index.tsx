import React, { useMemo } from "react";
import useSettingMode from "./hooks";
import styles from './styles.module.scss';
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import Link from "./Link";
import { EFuntionType } from "client-core";
import InputFile from "@/components/Forms/InputFile";

type SettingModeProps = {
    itemFunctionType: EFuntionType
}

const SettingMode = ({ itemFunctionType }:SettingModeProps) => {
    const { fileRef, linkType, showLinkSetting, handleClickOpenLinkSetting, handleClickOpenImageSetting, handleClickCloseLinkSetting, handleChangeImage } = useSettingMode();

    const hasMovie = useMemo(() => { 
        return itemFunctionType === EFuntionType.LINKANDMEDIA || itemFunctionType === EFuntionType.LINKANDMOVIE;
    }, [itemFunctionType]);

    const hasImage = useMemo(() => {
        return itemFunctionType === EFuntionType.LINKANDMEDIA || itemFunctionType === EFuntionType.LINKANDIMAGE;
     }, [itemFunctionType]);

    const hasLink = useMemo(() => {
        return itemFunctionType !== EFuntionType.NONE;
     }, [itemFunctionType]);

    return <React.Fragment>
        <div className={styles['wrap']}>
            {/* <div className={styles['top-container']}>
                <CircleButton variant="black" shape="circle" size="l" onClick={handleReset}>
                    <Icon name="Erase"/>
                </CircleButton>
            </div> */}
            <div className={styles['bottom-container']}>
                {hasLink  && <CircleButton variant="defualt" shape="circle" size="xxl" onClick={()=> handleClickOpenLinkSetting('link')}>
                    <Icon name="Link_M"/>
                </CircleButton> }
                {hasMovie && <CircleButton variant="defualt" shape="circle" size="xxl" onClick={()=> handleClickOpenLinkSetting('video')}>
                    <Icon name="Video"/>
                </CircleButton>}
             
                {hasImage && <CircleButton variant="defualt" shape="circle" size="xxl" onClick={handleClickOpenImageSetting}>
                    <Icon name="ImgUP_M" />
                    <InputFile ref={fileRef} onChange={handleChangeImage} />
                </CircleButton> }
            </div>
        </div>
        <Link isOpen={showLinkSetting} type={linkType} onClose={handleClickCloseLinkSetting} />
    </React.Fragment>
 }
export default SettingMode;