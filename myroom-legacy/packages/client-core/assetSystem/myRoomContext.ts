import { Nullable, Scene } from "@babylonjs/core";
import { EnvironmentController } from "./controllers/environmentController";
import { CameraController } from "./controllers/cameraController";
import { CSSRendererManager } from "./controllers/roomSubSystem/cssRenderer";
import { MaterialManager } from "./controllers/materialManager";


//---------------------------------------------------------------------------------------
// MyRoomContext : Framework에서 사용하게 위한 정보체들 (singleton을 사용할수 없어서)
//---------------------------------------------------------------------------------------
export class MyRoomContext {
    private _scene: Nullable<Scene> = null;
    private _envController: Nullable<EnvironmentController> = null;
    private _cameraController: Nullable<CameraController> = null;
    private _cSSRendererManager: CSSRendererManager;
    private _nodeMaterialManager: Nullable<MaterialManager> = null;
    private _changeRenderLoopFunc: ((isActive: boolean) => void) | undefined;

    public getScene(): Nullable<Scene> {
        return this._scene;
    }

    public getEnvController(): Nullable<EnvironmentController> {
        return this._envController;
    }

    public getCamera(): Nullable<CameraController> {
        return this._cameraController;
    }

    public getCSSRendererManager(): CSSRendererManager {
        return this._cSSRendererManager;
    }

    public getNodeMaterialManager(): Nullable<MaterialManager> {
        return this._nodeMaterialManager;
    }

    public constructor(scene: Scene, changeRenderLoopFunc?: (isActive: boolean) => void) {
        this._scene = scene;
        this._changeRenderLoopFunc = changeRenderLoopFunc;
        // camera 생성후 env 생성해야 한다.
        this._cameraController = new CameraController(this, this._scene);
        this._envController = new EnvironmentController(this._scene, true);
        this._cSSRendererManager = new CSSRendererManager();
        this._nodeMaterialManager = new MaterialManager(this._scene);
    }

    public finalize() {
        this._envController?.finalize();
        this._cameraController?.finalize();
        this._cSSRendererManager.finalize();
        this._nodeMaterialManager?.finalize();
    }

    public changeRenderLoop(isActive: boolean) {
        this._changeRenderLoopFunc?.(isActive);
    }
}