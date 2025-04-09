import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { getSceneModuleWithName } from "./createScene";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.uniformBuffer";
import { ConstantsEx } from "./assetSystem/constantsEx";
import { AvatarController } from "./assetSystem/controllers/avatarController";
import { BuildConfig } from "./common/buildConfig";

//
export { MyRoomAPI } from './myRoomAPI';
export { EPriceType, EItemCategory1, EFuntionType, EItemCategory2, ECurrencyType } from './tableData/defines/System_Enum';
export { ConstantsEx } from './assetSystem/constantsEx';
export { EMyRoomMode } from './assetSystem/controllers/myRoomController';
export { SelectionInfo } from "./assetSystem/controllers/roomSubSystem/InputHandler_PlaceMode";
export type { IMyRoomItemFunctionData, IAssetManifest_MyRoom } from './assetSystem/jsonTypes/manifest/assetManifest_MyRoom';
export { EMediaType } from './assetSystem/definitions';
export type { ISetFaceMorphData } from './assetSystem/definitions';
export type { IAssetManifest_Avatar } from "./assetSystem/jsonTypes/manifest/assetManifest_Avatar";
export { AssetUtils } from "./assetSystem/assetUtils";
export { EnvironmentController } from "./assetSystem/controllers/environmentController";
export { AvatarController } from "./assetSystem/controllers/avatarController";
export { ItemController } from "./assetSystem/controllers/itemController";
export { TableDataManager } from "./tableData/tableDataManager";
export { ECameraMode } from "./assetSystem/controllers/cameraController";

// const getModuleToLoad = (): string | undefined =>
//     location.search.split("scene=")[1]?.split("&")[0];

export const babylonInit = async (sceneName = "myRoom"): Promise<void> => {

    // Get the canvas element
    const canvas = document.getElementById(ConstantsEx.CANVAS_ID) as HTMLCanvasElement;
    if (!canvas) {
        console.warn("babylonInit:no renderCanvas");
        return;
    }
    // canvas.style.backgroundColor = 'blue';
    const canvasContainer = document.getElementById("renderCanvasContainer") as HTMLCanvasElement;
    if (!canvasContainer) {
        console.warn("babylonInit:no renderCanvasContainer");
        return;
    }
    canvasContainer.style.backgroundColor = '#5faed9';

    // get the module to load
    //const moduleName = getModuleToLoad();
    const createSceneModule = await getSceneModuleWithName(sceneName);
    const engineType =
        location.search.split("engine=")[1]?.split("&")[0] || "webgl";
    // Execute the pretasks, if defined
    await Promise.all(createSceneModule.preTasks || []);

    // Generate the BABYLON 3D engine
    let engine: Engine | null = null;
    if (engineType === "webgpu") {
        const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
        if (webGPUSupported) {
            const webgpu = engine = new WebGPUEngine(canvas, {
                adaptToDeviceRatio: true,
                antialias: true,
            });
            await webgpu.initAsync();
            engine = webgpu;
        }
    }

    if (!engine) {
        engine = new Engine(canvas, true);
    }

    // Create the scene
    const scene = await createSceneModule.createScene(engine, canvas);

    // JUST FOR TESTING. Not needed for anything else
    (window as any).scene = scene;

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene?.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine?.resize();
    });
};

