// import * as BABYLON from "@babylonjs/core";
// import { Nullable } from "@babylonjs/core";
// import { Engine } from "@babylonjs/core/Engines/engine";
// import { Scene } from "@babylonjs/core/scene";
// import { CreateSceneClass } from "../createScene";

// // required imports
// import "@babylonjs/core/Loading/loadingScreen";
// import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
// import "@babylonjs/core/Materials/standardMaterial";
// import "@babylonjs/loaders/glTF";

// import { ItemViewerController } from "../assetSystem/controllers/itemViewerController";
// import { AssetLoader } from "../assetSystem/loader/assetLoader";
// import { EnvironmentController } from "../assetSystem/controllers/environmentController";
// import { MyRoomContext } from "../assetSystem/myRoomContext";

// export class ItemViewer implements CreateSceneClass {
//     createScene = async (
//         engine: Engine,
//         canvas: HTMLCanvasElement
//     ): Promise<Scene> => {
//         // This creates a basic Babylon Scene object (non-mesh)
//         const scene = new Scene(engine);

//         if (false) {
//             void Promise.all([
//                 import("@babylonjs/core/Debug/debugLayer"),
//                 import("@babylonjs/inspector"),
//             ]).then((_values) => {
//                 scene.debugLayer.show({
//                     handleResize: true,
//                     overlay: true,
//                     globalRoot: document.getElementById("#root") || undefined,
//                 });
//             });
//         }



//         // const camera = new BABYLON.ArcRotateCamera("camera", 1.567, 1.315, 11.0, new BABYLON.Vector3(0, 2.8, 0), scene)
//         // camera.wheelPrecision = 12
//         // camera.lowerRadiusLimit = 2
//         // camera.upperRadiusLimit = 23.0
//         // camera.pinchDeltaPercentage = 0.01
//         // camera.wheelDeltaPercentage = 0.01
//         // //camera.useBouncingBehavior = true
//         // camera.attachControl()
//         const myRoomContext = new MyRoomContext(scene);

//         const assetLoader = new AssetLoader(myRoomContext, scene);

//         new EnvironmentController(scene, true);

//         new ItemViewerController(scene, assetLoader);

//         //File Input : ------------------------------------------------------------------
//         const fileHandler = new FileDragDropHandler(scene);
//         fileHandler.monitorElementForDragNDrop(canvas);

//         //Input 처리 : ------------------------------------------------------------------
//         scene.onKeyboardObservable.add((kbInfo) => {
//             switch (kbInfo.type) {
//                 case BABYLON.KeyboardEventTypes.KEYDOWN:
//                     if ("Backquote" === kbInfo.event.code) {
//                         scene.debugLayer.hide();
//                         scene.debugLayer.show({ handleResize: true, overlay: true });
//                         // if (scene.debugLayer.isVisible()) {
//                         //     scene.debugLayer.hide()
//                         // }
//                         // else {
//                         //     scene.debugLayer.show()
//                         // }
//                     }
//                     break;
//             }
//         });

//         return scene;
//     };
// }



// /**
//  * Drag & Drop 한 파일의 관리
//  * @Internal
//  */
// class FileDragDropHandler {
//     private _scene: Nullable<BABYLON.Scene> = null;
//     private _elementToMonitor: Nullable<HTMLElement> = null;
//     private _dragEnterHandler: Nullable<(e: any) => void> = null;
//     private _dragOverHandler: Nullable<(e: any) => void> = null;

//     constructor(scene: BABYLON.Scene) {
//         this._scene = scene;
//         console.log(`${this._scene}`); // 에러방지
//     }

//     public monitorElementForDragNDrop(elementToMonitor: HTMLElement): void {
//         if (elementToMonitor) {
//             this._elementToMonitor = elementToMonitor;

//             this._dragEnterHandler = (e) => {
//                 this._drag(e);
//             };
//             this._dragOverHandler = (e) => {
//                 this._drag(e);
//             };

//             this._elementToMonitor.addEventListener("dragenter", this._dragEnterHandler, false);
//             this._elementToMonitor.addEventListener("dragover", this._dragOverHandler, false);
//         }
//     }

//     public dispose() {
//         if (!this._elementToMonitor) {
//             return;
//         }

//         if (this._dragEnterHandler) {
//             this._elementToMonitor.removeEventListener("dragenter", this._dragEnterHandler);
//         }

//         if (this._dragOverHandler) {
//             this._elementToMonitor.removeEventListener("dragover", this._dragOverHandler);
//         }
//     }

//     private _drag(e: DragEvent): void {
//         e.stopPropagation();
//         e.preventDefault();
//     }
// }


// export default new ItemViewer();