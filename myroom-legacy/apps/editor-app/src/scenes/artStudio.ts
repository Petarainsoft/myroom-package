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


import { AvatarController } from "client-core/assetSystem/controllers/avatarController";
import { ParticleController } from "client-core/assetSystem/controllers/particleController";
import { ParticleControllerTool } from "client-core/assetSystem/controllers/particleControllerTool";
import { MyRoomContext } from "client-core/assetSystem/myRoomContext";
import { ParticleSaver } from "client-core/assetSystem/controllers/particleSubSystem/particleSaver";
import { ParticleLoader } from "client-core/assetSystem/controllers/particleSubSystem/particleLoader";

/**
 * 아트팀 환경설정 및 모델 테스트용 씬
 */
export class ArtStudio implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);


        import("@babylonjs/node-editor");

        //debug 용
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



        // const camera = new BABYLON.ArcRotateCamera("camera", 1.567, 1.315, 11.0, new BABYLON.Vector3(0, 2.8, 0), scene);
        // camera.wheelPrecision = 12;
        // camera.lowerRadiusLimit = 2;
        // camera.upperRadiusLimit = 23.0;
        // camera.pinchDeltaPercentage = 0.01;
        // camera.wheelDeltaPercentage = 0.01;
        // //camera.useBouncingBehavior = true
        // camera.attachControl();

        const roomContext = new MyRoomContext(scene);

        const assetLoader = new AssetLoader(roomContext, scene);
        //환경설정 : ---------------------------------------------------------------------
        //new EnvironmentController(scene, true);

        //AvatarController : ------------------------------------------------------------
        new AvatarController("테스트용", scene, assetLoader, roomContext, null);

        new ParticleControllerTool(scene);

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

/**
 * Drag & Drop 한 파일의 관리
 * @Internal
 */
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
            this._dropHandler = (e) => {
                this._drop(e);
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

    private _drop(eventDrop: DragEvent): void {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        this._loadFiles(eventDrop);
    }

    private _loadFiles(event: any): void {
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
                if (ext === "env") {

                    // const dropFile = this._filesToLoad[ii]
                    // const dropFileName = dropFile.name.toLowerCase()
                    // BABYLON.FilesInput.FilesToLoad[dropFileName] = dropFile //==> "file:" 을 url로 사용시 바빌론 내부에서 FilesInput.FilesToLoad에서 File 을 찿는다
                    // const dropFilePath = "file:" + dropFileName

                    // if (this._scene) {
                    //     this._scene.environmentTexture = new BABYLON.CubeTexture(dropFilePath, this._scene, null, false, null, null, null, undefined, true, null, true)

                    //     for (let i = 0; i < this._scene.materials.length; ++i) {
                    //         const material = this._scene.materials[i] as BABYLON.StandardMaterial | BABYLON.PBRMaterial
                    //         if (material.name === "skyBox") {
                    //             const reflectionTexture = material.reflectionTexture
                    //             if (reflectionTexture && reflectionTexture.coordinatesMode === BABYLON.Texture.SKYBOX_MODE) {
                    //                 material.reflectionTexture = this._scene.environmentTexture.clone()
                    //                 if (material.reflectionTexture) {
                    //                     material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
                    //                 }
                    //             }
                    //         }
                    //     }
                    // }
                }
                else if (ext === ParticleLoader.EXTENSION) {
                    ParticleSaver.loadFile(this._scene!,this._filesToLoad[ii]);
                }
                else if (ext === "glb") {
                    //==> ArrayBufferView로 로딩
                    // this._filesToLoad[ii].arrayBuffer().then((buffer) => {
                    //     BABYLON.SceneLoader.ImportMesh("", "", new Uint8Array(buffer), this._scene, undefined, undefined, undefined, ".glb");
                    // });


                    //File로 로딩
                    BABYLON.SceneLoader.ImportMesh("", "", this._filesToLoad[ii], this._scene);
                }
                else {
                    this._scene?.debugLayer.hide();
                    this._scene?.debugLayer.show({ handleResize: true, overlay: true });
                }
            }
        }
    }
}


export default new ArtStudio();
