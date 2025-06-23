import React from 'react';
import style from './style.module.scss';
import View from '../../_shared/layouts/View';
import RoomScene from '../../Room_LEGACY/RoomScene';
import { Outlet } from 'react-router-dom';
import { atom, useAtom } from 'jotai';
import { auth } from '@/common/utils/auth';
import useAuth from "@/common/hooks/use-auth";
import useRoom from '../../Room_LEGACY/useRoom';
import useSelectionEvent from '../../Room_LEGACY/useSelectionEvent';
import { ItemController, ConstantsEx } from 'client-core';
import { setMaxWidth } from '@/App';
import { isInitializedRoomSceneAtom } from '@/common/stores';
import { SceneManager } from '@/common/utils/client';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { useNavigate } from 'react-router-dom';
import { KHHomeUrl } from '..';

const isLoadedAtom = atom(false);

export const LANG = 'ko';

const KHLobby = () => {
    const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom);
    const isInitializedRoomScene = useAtom(isInitializedRoomSceneAtom);
    const {signout } = useAuth();
    const [isShowRoomLoading, setIsShowRoomLoading] = React.useState(false);
    const navigate = useNavigate();

    useRoom(false, ConstantsEx.SERVICE_KH);
    useSelectionEvent((controller?: ItemController) => {
        console.log("KHLobby - useRoom", controller);
        // const itemData = controller?.getItemTableData();

    });

    React.useLayoutEffect(() => {
        setMaxWidth('4096px');
    }, []);

    React.useEffect(() => {
        console.log("KHLobby - init");
        if (auth.isLogined()) {
            auth.clearCredential();
            signout();
            setIsLoaded(false);
        }

        setIsLoaded(true);

    }, []);

    const handleClickStart = React.useCallback(() => {
        if (isInitializedRoomScene) {
            setIsShowRoomLoading(false);
            SceneManager.Room?.startRoom();
        }
    }, [isInitializedRoomScene]);

    const onPrev = () => {
        navigate(KHHomeUrl);
    };


    return isLoaded ? (
        <View
            disableNavigation={true}
        >
            <RoomScene />
            <Outlet />
            {isShowRoomLoading && <div className={style.roomLoading} onClick={handleClickStart} />}
            <CustomButton className={style.prev_button} onClick={onPrev}>
                <Icon name="joysam/Arrow_left_M" />
            </CustomButton>
        </View>
    ) : (
        <div className={style['loading']}>
            <div className={style['loadingText']}>Loading...</div>
        </div>
    );
};

export default KHLobby;