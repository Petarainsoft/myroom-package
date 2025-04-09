import React from 'react';
import style from './style.module.scss';
import View from '../../_shared/layouts/View';
import RoomScene from '../../Room_LEGACY/RoomScene';
import { Outlet } from 'react-router-dom';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { auth } from '@/common/utils/auth';
import useAuthAPI from "@/apis/User/Auth";
import useAuth from "@/common/hooks/use-auth";
import useRoom from '../../Room_LEGACY/useRoom';
import useSelectionEvent from '../../Room_LEGACY/useSelectionEvent';
import { ItemController, EFuntionType, ConstantsEx } from 'client-core';
import useModal from '@/common/hooks/Modal/useModal';
import { setMaxWidth } from '@/App';
import { isInitializedRoomSceneAtom } from '@/common/stores';
import { SceneManager } from '@/common/utils/client';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { useNavigate } from 'react-router-dom';
import { KHHomeUrl } from '..';

const isLoadedAtom = atom(false);

export const LANG = 'ko';
const id = "kh001";
const password = "kh001";

const KHLobby = () => {
    const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom);
    const isInitializedRoomScene = useAtom(isInitializedRoomSceneAtom);
    const { mutationPostAuthSigninEmail } = useAuthAPI();
    const { signin, isLogined, signout } = useAuth();
    const [isShowRoomLoading, setIsShowRoomLoading] = React.useState(false);
    const navigate = useNavigate();

    useRoom(false, ConstantsEx.SERVICE_KH);
    useSelectionEvent((controller?: ItemController) => {
        console.log("KHLobby - useRoom", controller);
        const itemData = controller?.getItemTableData();
        if (controller && itemData) {

        }
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

        const res = mutationPostAuthSigninEmail.mutateAsync({
            data: {
                id,
                password
            },
            params: {
                p: "", w: ""
            }
        }).then((res) => {
            if (res) {
                console.log("KHLobby - setCredential", res);
                const { access_token, expires, refresh_token, token_type } = res.credential;
                auth.setCredential({
                    accessToken: access_token,
                    expires: expires,
                    refreshToken: refresh_token,
                    tokenType: token_type
                });
                signin();
                setIsLoaded(true);
            }
        });

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