import * as BABYLON from "@babylonjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { useAtom } from 'jotai';
import SceneComponent from 'babylonjs-hook';
import style from './style.module.scss';
import { Scene } from '@babylonjs/core';
import { ItemModelIconGenerator } from "../../common/itemModelIconGenerator";
import { iconSettingAtom} from '@/common/stores';

interface IModelSceneProp {
  canvasId:string
}

const ModelScene = (prop:IModelSceneProp) =>{
    const [iconSetting,setIconSetting] = useAtom(iconSettingAtom);

    const onSceneReady = (scene: Scene) => {
        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]);

        new ItemModelIconGenerator(scene);
    };

    //Scene => UI (주기적으로 IconSetting 값을 변경한다)
    useEffect(() => {
        const interval = setInterval(() => {
            const sceneCameraSetting = ItemModelIconGenerator.getInstance().getCurrentCameraSetting();
            const epsilon = 0.01;
            if( !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.alpha , iconSetting.alpha ,epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.beta , iconSetting.beta, epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.radius , iconSetting.radius, epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.fov , iconSetting.fov, epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.target[0] , iconSetting.lookTarget.x, epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.target[1] , iconSetting.lookTarget.y, epsilon) ||
                !BABYLON.Scalar.WithinEpsilon(sceneCameraSetting.target[2] , iconSetting.lookTarget.z, epsilon))
            {
                setIconSetting((pre)=>({...pre,
                    alpha:sceneCameraSetting.alpha,
                    beta:sceneCameraSetting.beta,
                    radius:sceneCameraSetting.radius,
                    fov:sceneCameraSetting.fov,
                    lookTarget:new BABYLON.Vector3(sceneCameraSetting.target[0],sceneCameraSetting.target[1],sceneCameraSetting.target[2])
                }));
            }
        }, 1000);

        return () => clearInterval(interval);
    },[]);

    //UI => Scene
    useEffect(() => {
        ItemModelIconGenerator.getInstance().updateIconSetting(
        {
            alpha:iconSetting.alpha,
            beta:iconSetting.beta,
            radius:iconSetting.radius,
            fov:iconSetting.fov,
            target:[iconSetting.lookTarget.x,iconSetting.lookTarget.y,iconSetting.lookTarget.z]
        },
        iconSetting.iconSize);
    }, [iconSetting]);

    return (
        <SceneComponent antialias onSceneReady={onSceneReady} id={prop.canvasId} className={style.modelScene} />
    );
};

export default ModelScene;
