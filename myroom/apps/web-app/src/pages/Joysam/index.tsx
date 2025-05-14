import React from 'react';
import style from './style.module.scss';
import View from '../_shared/layouts/View';
import RoomScene from '../Room_LEGACY/RoomScene';
import { Outlet } from 'react-router-dom';
import { atom, useAtom} from 'jotai';
import useRoom from '../Room_LEGACY/useRoom';
import useSelectionEvent from '../Room_LEGACY/useSelectionEvent';
import { ItemController, EFuntionType, ConstantsEx } from 'client-core';
import useModal from '@/common/hooks/Modal/useModal';
import { setMaxWidth } from '@/App';
import { isInitializedRoomSceneAtom } from '@/common/stores';
import { SceneManager } from '@/common/utils/client';

const isLoadedAtom = atom(false);

export const LANG = 'ko';

const Joysam = () => {
    const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom);
    const isInitializedRoomScene = useAtom(isInitializedRoomSceneAtom);
    const JoysamModelListModal = useModal('JoysamModelListModal');
    const JoysamModelInfoModal = useModal('JoysamModelInfoModal');
    const DialogModal = useModal('DialogModal');
    const JoysamItemDetailModal = useModal('JoysamItemDetailModal');
    const [isShowRoomLoading, setIsShowRoomLoading] = React.useState(false);

    useRoom(false, ConstantsEx.SERVICE_JOYSAM);
    useSelectionEvent((controller?: ItemController) => {
        console.log("Joysam - useRoom", controller);
        const itemData = controller?.getItemTableData();
        if (controller && itemData) {
            if (itemData.funtion === EFuntionType.DIALOG) {
                const finishAction = controller.zoomIn();
                DialogModal.createModal({
                    dialogId: itemData.funtion_address,
                    closeCallback: () => {
                        finishAction?.();
                    }
                });
            } else if (itemData.funtion === EFuntionType.SHOWUI3DGALLERY) {
                JoysamModelListModal.createModal({});
            } else if (itemData.funtion === EFuntionType.SHOWUI3DITEM) {
                JoysamModelInfoModal.createModal({
                    itemId: controller.getItemId(),
                });
            } else if (itemData.funtion !== EFuntionType.NONE) {
                JoysamItemDetailModal.createModal({
                    itemId: controller.getItemId(),
                });
            }
        }
    });

    React.useLayoutEffect(() => {
        setMaxWidth('4096px');
    }, []);

    React.useEffect(() => {
        console.log("Joysam - init");
        setIsLoaded(true);

    }, []);

    const handleClickStart = React.useCallback(() => {
        if (isInitializedRoomScene) {
            setIsShowRoomLoading(false);
            SceneManager.Room?.startRoom();
        }
    }, [isInitializedRoomScene]);


    return isLoaded ? (
        <View
            disableNavigation={true}
        >
            <RoomScene />
            <Outlet />
            {isShowRoomLoading && <div className={style.roomLoading} onClick={handleClickStart} />}
        </View>
    ) : (
        <div className={style['loading']}>
            <div className={style['loadingText']}>Loading...</div>
        </div>
    );
};

export default Joysam;