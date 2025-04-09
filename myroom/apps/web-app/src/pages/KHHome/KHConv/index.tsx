import React from 'react';
import style from './style.module.scss';
import View from '../../_shared/layouts/View';
import { Outlet } from 'react-router-dom';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FaceWebCam } from '@/common/faceWebCam';
import CanvasScene from '@/pages/_shared/ui/CanvasScene';
import { IAssetManifest_Avatar, ECameraMode } from "client-core";
import { SceneManager } from '@/common/utils/client';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { useNavigate, useLocation } from 'react-router-dom';
import { KHHomeUrl } from '..';
import queryString from 'query-string';

const isLoadedAtom = atom(false);

const KHConv = () => {
    const query = queryString.parse(useLocation().search);
    const guestIsMale = query['guest'] === '1';
    const strPeriod = query['period'];
    let period: number | undefined = undefined;
    if (strPeriod) period = Number(strPeriod);

    const isLoaded = true;
    const [isReady, setIsReady] = React.useState(false);
    const navigate = useNavigate();

    const onReadyForGuest = () => {
        const manifest: IAssetManifest_Avatar = {
            format: 3,
            main: {
                type: "Avatar",
                skeleton: "IrvHeMEb6fGZbkOrEdr0a",
                equipments: [
                    guestIsMale ? "F5wGT4YhaQQV5b1rg9pyq" : "9QxdFbZDiRCoUU0uTipuq"
                ],
                animation: "MduIYato3xRxzdZ74OZEm"
            }
        };

        const api = SceneManager.Avatar;
        api?.initializeAvatar("Mannequin", manifest, () => {
            api.setCameraMode(ECameraMode.KHConv);
            api?.enableFaceTracking(() => {
                console.log('setIsReady');
                setIsReady(true);
            });
        });
    };

    const onReadyForDoctor = () => {
        console.log("onReadyForDoctor");
        const manifest: IAssetManifest_Avatar = {
            format: 3,
            main: {
                type: "Avatar",
                skeleton: "IrvHeMEb6fGZbkOrEdr0a",
                equipments: [
                    "BJxCZnW9cCMoFVcpqcK48",
                ],
                animation: "MduIYato3xRxzdZ74OZEm"
            }
        };

        const api = SceneManager.getAPI('AVATAR2');
        api?.initializeAvatar("Mannequin2", manifest, () => {
            api.setCameraMode(ECameraMode.KHConv);
        });
    };

    const onPrev = () => {
        navigate(KHHomeUrl);
    };

    return (
        <View
            disableNavigation={true}
            className={style['container']}
        >
            <CanvasScene className={style['scene-container1']} onAfterSceneReady={onReadyForGuest} type={'AVATAR'} />
            {<CanvasScene className={style['scene-container2']} onAfterSceneReady={onReadyForDoctor} type={'AVATAR2'} />}
            <FaceWebCam className={style.webcam} isReady={isReady} showCamera={false} period={period} />
            <Outlet />

            <CustomButton className={style.prev_button} onClick={onPrev}>
                <Icon name="joysam/Arrow_left_M" />
            </CustomButton>
        </View>
    );
}

export default KHConv;