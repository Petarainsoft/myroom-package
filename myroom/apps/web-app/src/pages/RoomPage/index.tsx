import React, { useCallback, useMemo } from "react"
import View from "../_shared/layouts/View";
import CanvasScene from "../_shared/ui/CanvasScene";
import { Outlet } from "react-router-dom";
import useRoomPage from "./hooks";
import RoomProfile from "../_shared/ui/Profiles/RoomProfile";
import styles from './styles.module.scss';
import SavePurchaseButton from "../_shared/ui/Buttons/SavePurchaseButton";
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";

const RoomPage = () => {
    const { sceneStatus, roomMode, hideRoomPlaceUI, roomBackgroundColor, currentRoomInfo, roomSelectedItem, handleClickProfile, handleClickClose, handleClickSave, onAfterSceneReady } = useRoomPage();
    
    const ActionArea = useCallback(()=>{
        if(roomMode === 'MAIN') {
            return <CircleButton onClick={handleClickProfile} size="m">
                <Icon name={currentRoomInfo?.mine ? `Top_Menu_M` : 'Top_Menu_User_M'} />
            </CircleButton>
        }
        else if(roomMode === 'PLACE' && !hideRoomPlaceUI){
            return <SavePurchaseButton onSave={handleClickSave}/>
        }
        else {
            return null;
        }
    },[handleClickSave, hideRoomPlaceUI, roomMode, currentRoomInfo, handleClickProfile]);

    return <React.Fragment>
        <View 
            fixed
            disableNavigation={(roomSelectedItem  !== null && roomSelectedItem.type === 'FIGURE') || roomMode === 'PLACE'}
            headerOptions={{
                float: true,
                closeOptions:{
                    icon: 'x',
                    disabled: roomMode === 'MAIN' || hideRoomPlaceUI,
                    onClick: handleClickClose
                },
                startArea: roomMode === 'MAIN' && <RoomProfile />,
                endArea: <ActionArea/>
            }}
            
            >
            <CanvasScene className={styles['scene']} type="ROOM" onAfterSceneReady={onAfterSceneReady} backgroundColor={roomBackgroundColor}/>
            {sceneStatus === 'LOADED' && <Outlet />}
        </View>
    </React.Fragment>
}

export default RoomPage;