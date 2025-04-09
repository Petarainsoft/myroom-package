import { Nullable } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { CreateSceneClass } from "client-core/createScene";

// required imports
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";

import { AssetLoader } from "client-core/assetSystem/loader/assetLoader";


//import { EnvironmentController } from "../assetSystem/controllers/environmentController";
import { AvatarController } from "client-core/assetSystem/controllers/avatarController";
import { AvatarFacialExpressionTool } from "client-core/assetSystem/controllers/avatarFacialExpressionTool";
import { MyRoomContext } from "client-core/assetSystem/myRoomContext";
import { SceneSerializer } from "@babylonjs/core";

/**
 * 아트팀 환경설정 및 모델 테스트용 씬
 */
export class SceneFacialExpression implements CreateSceneClass
{
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);


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




        // const camera = new BABYLON.ArcRotateCamera("camera", 1.567, 1.315, 11.0, new BABYLON.Vector3(0, 2.8, 0), scene)
        // camera.wheelPrecision = 12
        // camera.lowerRadiusLimit = 2
        // camera.upperRadiusLimit = 23.0
        // camera.pinchDeltaPercentage = 0.01
        // camera.wheelDeltaPercentage = 0.01
        // //camera.useBouncingBehavior = true
        // camera.attachControl()
        const myRoomContext = new MyRoomContext(scene);

        const assetLoader = new AssetLoader(myRoomContext, scene);

        //new EnvironmentController(scene, true);

        //new ItemViewerController(scene, assetLoader);
        new AvatarFacialExpressionTool(scene, assetLoader, myRoomContext);

        //File Input : ------------------------------------------------------------------
        const fileHandler = new FileDragDropHandler(scene);
        fileHandler.monitorElementForDragNDrop(canvas);

        //Input 처리 : ------------------------------------------------------------------
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    if ("Backquote" === kbInfo.event.code) {
                        scene.debugLayer.hide();
                        scene.debugLayer.show({ handleResize: true, overlay: true });
                        // if (scene.debugLayer.isVisible()) {
                        //     scene.debugLayer.hide()
                        // }
                        // else {
                        //     scene.debugLayer.show()
                        // }
                    }
                    break;
            }
        });

        return scene;
    };
}



class FileDragDropHandler {
    private _scene: Nullable<BABYLON.Scene> = null;
    private _elementToMonitor: Nullable<HTMLElement> = null;
    private _filesToLoad: File[] = [];

    private _dragEnterHandler: Nullable<(e: any) => void> = null;
    private _dragOverHandler: Nullable<(e: any) => void> = null;
    private _dropHandler: Nullable<(e: any) => void> = null;

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
    }

    public monitorElementForDragNDrop(elementToMonitor: HTMLElement): void {
        if (elementToMonitor) {
            this._elementToMonitor = elementToMonitor;

            this._dragEnterHandler = (e) => {
                this._drag(e);
            };
            this._dragOverHandler = (e) => {
                this._drag(e);
            };
            this._dropHandler = async (e) => {
                await this._drop(e);
            };

            this._elementToMonitor.addEventListener("dragenter", this._dragEnterHandler, false);
            this._elementToMonitor.addEventListener("dragover", this._dragOverHandler, false);
            this._elementToMonitor.addEventListener("drop", this._dropHandler, false);
        }
    }

    public dispose() {
        if (!this._elementToMonitor) {
            return;
        }

        if (this._dragEnterHandler) {
            this._elementToMonitor.removeEventListener("dragenter", this._dragEnterHandler);
        }

        if (this._dragOverHandler) {
            this._elementToMonitor.removeEventListener("dragover", this._dragOverHandler);
        }

        if (this._dropHandler) {
            this._elementToMonitor.removeEventListener("drop", this._dropHandler);
        }
    }

    private _drag(e: DragEvent): void {
        e.stopPropagation();
        e.preventDefault();
    }

    private async _drop(eventDrop: DragEvent): Promise<void> {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        await this._loadFiles(eventDrop);
    }

    private async _loadFiles(event: any): Promise<void> {
        // Handling data transfer via drag'n'drop
        if (event && event.dataTransfer && event.dataTransfer.files) {
            this._filesToLoad = event.dataTransfer.files;
        }

        // Handling files from input files
        if (event && event.target && event.target.files) {
            this._filesToLoad = event.target.files;
        }

        if (!this._filesToLoad || this._filesToLoad.length === 0) {
            return;
        }

        if (this._filesToLoad && this._filesToLoad.length > 0) {
            for (let ii = 0; ii < this._filesToLoad.length; ++ii) {
                const ext = this._filesToLoad[ii].name.split(".").pop()?.toLowerCase();
                if (ext === "glb") {
                    //==> ArrayBufferView로 로딩
                    // await this._filesToLoad[ii].arrayBuffer().then((buffer) => {
                    //     const result = BABYLON.SceneLoader.ImportMesh("", "", new Uint8Array(buffer), this._scene, undefined, undefined, undefined, ".glb");

                    //     //console.log(`==> result : ${JSON.stringify(result)}`);
                        
                    // });


                    //File로 로딩
                    const result = await BABYLON.SceneLoader.ImportMesh("", "", this._filesToLoad[ii], this._scene);
                    //console.log(`==> result : ${JSON.stringify(result)}`);

                    console.log(`==> result : ${JSON.stringify(SceneSerializer.Serialize(this._scene!))}`);
                }
                else {
                    this._scene?.debugLayer.hide();
                    this._scene?.debugLayer.show({ handleResize: true, overlay: true });
                }
            }
        }
    }
}

export default new SceneFacialExpression();
