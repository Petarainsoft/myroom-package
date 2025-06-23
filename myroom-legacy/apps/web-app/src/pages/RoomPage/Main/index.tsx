import React from "react"
import useMain from "./hooks";
import LinkPreview from "./LinkPreview";
import OnBoardingUI from "./OnBoardingUI";
import SignInSheet from "./SignInSheet";
import RoomInfo from "./RoomInfo";
import Toggle from '@/components/Toggle/Toggle';
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import styles from './styles.module.scss';
import ProfileUI from "@/pages/_shared/offcanvas/ProfileOffCanvas";
import BalloonLayer from "./BalloonLayer";

const Main = () => {
    const {currentRoomInfo, showAlwaysRoomInfo, roomSelectedItem, handleToggle, handleClickPlace, handleClickZoomOut, handleClickBalloon} = useMain();

    return <React.Fragment>
        <RoomInfo />
        <SignInSheet />
        <OnBoardingUI />
        <LinkPreview />
        <ProfileUI />
        <BalloonLayer />
        <CircleButton size={"l"} shape="circle" className={styles['zoom-button']} onClick={handleClickZoomOut}>
            <Icon name={'Area'}/>
        </CircleButton>
        
        {roomSelectedItem?.type !== 'FIGURE'  && <>
            <Toggle className={styles['toggle-button']} isActive={showAlwaysRoomInfo} handleIsActive={handleToggle}></Toggle>
            {currentRoomInfo?.mine && <CircleButton size={"l"} shape="circle-bl" className={styles['place-button']} onClick={handleClickPlace}>
                <Icon name={'Share'}/>
            </CircleButton>}
            <CircleButton size={"l"} shape="circle-bl" className={styles['balloon-button']} onClick={handleClickBalloon}>
                <Icon name={'Post_Memo_Balloon_Off'}/>
            </CircleButton>
        </>}
    </React.Fragment>
}

export default Main;