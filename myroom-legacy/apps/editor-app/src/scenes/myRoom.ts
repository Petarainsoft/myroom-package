//@ts-ignore
import * as BABYLON from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { CreateSceneClass } from "client-core/createScene";

// required imports
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";


//import roomEnvironment from "../../src/assets/environment/room.env"

//import { AssetLoader } from "../assetSystem/loader/assetLoader";
//@ts-ignore
import { EMediaType, eAssetType } from "../assetSystem/definitions";
//import { TestParticle } from "../testParticle/testParticle"


//import { EnvironmentController } from "../assetSystem/controllers/environmentController";
//import { TableDataManager } from "../tableData/tableDataManager";
//import { MyRoomController } from "../assetSystem/controllers/myRoomController";
//import { CameraController } from "../assetSystem/controllers/cameraController";
//import { MyRoomController } from "../assetSystem/controllers/myRoomController";
import { MyRoomAPI } from "client-core/myRoomAPI";
import { TableDataManager } from "client-core/tableData/tableDataManager";
//import { IAssetManifest_MyRoom } from "../assetSystem/jsonTypes/manifest/assetManifest_MyRoom";

export class MyRoomAPIRecordPlayer extends BABYLON.TransformNode {
    private _api: MyRoomAPI;
    public constructor(scene: BABYLON.Nullable<BABYLON.Scene>, api: MyRoomAPI) {
        super("[MyRoomAPIRecordPlayer]", scene);
        this._api = api;
        this.inspectableCustomProperties = [];
        this.inspectableCustomProperties.push({
            label: "Load Recording Data",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._api.loadRecordingData(file);
            },
            accept: ".json"
        });

        this.inspectableCustomProperties.push({
            label: "Play Recording Dasta",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this._api.playRecordingData();
            }
        });

    }
}



export class MyRoom implements CreateSceneClass {
    createScene = async (
        engine: Engine//,
        //canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        import("@babylonjs/node-editor");

        // debug 용
        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });



        const tableDataMgr = new TableDataManager();
        tableDataMgr.loadTableDatas();

        const RENDER_PERIOD_ACTIVE = 2; // 30 fps로 (60/2)
        const myRoomAPI = new MyRoomAPI(scene, RENDER_PERIOD_ACTIVE, true);
        const recordReplayer = new MyRoomAPIRecordPlayer(scene, myRoomAPI);

        scene.onAfterRenderObservable.addOnce((_scene) => {
            myRoomAPI.initializeMyRoom(null, false, () => {
                // myRoomAPI.addCameraDistanceChangeEventHandler((camDist: number) => {
                //     console.log(camDist);
                // });
            });
        });

        // scene.onKeyboardObservable.add((eventData) => {
        //     switch (eventData.type) {
        //         case BABYLON.KeyboardEventTypes.KEYUP:
        //             if ("Enter" === eventData.event.code && eventData.event.ctrlKey) {
        //                 //load는 MyRoomAPIRecordPlayer 통해서
        //                 myRoomAPI.playRecordingData();
        //             }
        //             break;
        //     }
        // });

        return scene;
    };
}

export default new MyRoom();
