import React from "react";
import SceneComponent from 'babylonjs-hook';
import style from './style.module.scss';
import { Scene } from '@babylonjs/core';
import { EditorApp } from "@/core/front/editorApp";
import { GlobalState } from "../globalState";

interface IModelSceneProp {
  canvasId:string,
  globalState: GlobalState;
}

const ModelScene = (prop:IModelSceneProp) =>{
    const onSceneReady = (scene: Scene) => {
        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then(() => {
            scene.debugLayer.hide();
        });

        new EditorApp(scene);
        EditorApp.getInstance().initialize(prop.globalState.editorMode);
        EditorApp.getInstance().registerIpcChannelEventListerner_Editor();
    };

    return (
        <SceneComponent antialias onSceneReady={onSceneReady} id={prop.canvasId} className={style.modelScene} />
    );
};

export default ModelScene;
