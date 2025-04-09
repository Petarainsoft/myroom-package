import * as BABYLON from "@babylonjs/core";
import { MyRoomContext } from "client-core/assetSystem/myRoomContext";
import { TableDataManager } from 'client-core/tableData/tableDataManager';
import { EditorConstants } from "../constant";
import { ipcRenderer } from "electron";
import DragDropMonitor from "./dragDropMonitor";
import { EEditorMode, EditorModeBase } from "./editorMode/editorModeBase";
import { EditorMode_ItemEditor } from "./editorMode/editorMode_MaterialEditor";
import { IAssetLoader } from "client-core/assetSystem/definitions";
import { AssetLoader } from "client-core/assetSystem/loader/assetLoader";
import { UIController } from "./uiController/uiController";
import { ModelControllerBase, ModelController_MaterialEditor } from "./editorMode/modelController";
import { EditorMode_ItemViewer } from "./editorMode/editorMode_ItemViewer";
import { EditorMode_EquipEditor } from "./editorMode/editorMode_EquipEditor";

export class EditorApp {
    private static _instance: EditorApp;
    private _initialized: boolean = false;
    private _scene: BABYLON.Scene;
    private _myRoomContext: MyRoomContext;
    private _assetLoader: IAssetLoader | null = null;
    private _dragDropMonitor: DragDropMonitor | null = null;
    private _currentEditorMode: EditorModeBase | null = null;
    private _currentEditorModeUpdateObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
    private _uiController: UIController;

    public getRoomContext(): MyRoomContext {
        return this._myRoomContext;
    }

    public getEditorMode(): EEditorMode {
        return this._currentEditorMode ? this._currentEditorMode.editorMode : EEditorMode.None;
    }

    public getScene(): BABYLON.Scene {
        return this._scene;
    }

    public getAssetLoader(): IAssetLoader | null {
        return this._assetLoader;
    }

    public getUIController(): UIController {
        return this._uiController;
    }

    public getModelController<T>(): T | null {
        if (this._currentEditorMode) {
            return this._currentEditorMode.getToolModelController() as T;
        }

        return null;
    }

    public getCurrentEditorMode(): EditorModeBase | null {
        return this._currentEditorMode;
    }

    public constructor(scene: BABYLON.Scene) {
        BABYLON.DracoCompression.DefaultNumWorkers = 0;

        EditorApp._instance = this;
        this._scene = scene;
        this._myRoomContext = new MyRoomContext(this._scene);

        this._uiController = new UIController(this);
    }

    public async initialize(mode: EEditorMode): Promise<void> {
        this._assetLoader = new AssetLoader(this._myRoomContext, this._scene, mode === EEditorMode.MaterialEditor);
        new TableDataManager();
        await TableDataManager.getInstance().loadTableDatas();

        this._initializeDragDropMonitor();
        this._changeEditorMode(mode);

        this._myRoomContext.getEnvController()?.showSkybox(false);
        this._initialized = true;

    }

    public isInitialized(): boolean {
        return this._initialized;
    }

    public executeCommand(command: string, ...args: any[]): void {
        if (this._currentEditorMode) {
            this._currentEditorMode.executeCommand(command, ...args);
        }
    }

    public changeEditorMode(newMode: EEditorMode): void {
        this._changeEditorMode(newMode);
    }

    //-----------------------------------------------------------------------------------
    // Editor Mode
    //-----------------------------------------------------------------------------------
    private _changeEditorMode(newMode: EEditorMode): void {
        if (this._currentEditorMode && this._currentEditorMode.editorMode === newMode) {
            return;
        }

        if (this._currentEditorMode) {
            this._currentEditorMode.endMode();
            this._currentEditorMode = null;
            if (this._currentEditorModeUpdateObserver) {
                this._scene.onBeforeRenderObservable.remove(this._currentEditorModeUpdateObserver);
                this._currentEditorModeUpdateObserver = null;
            }
        }

        switch (newMode) {
            case EEditorMode.MaterialEditor:
                {
                    this._currentEditorMode = new EditorMode_ItemEditor(this);
                    this._currentEditorModeUpdateObserver = this._scene.onBeforeRenderObservable.add(this._currentEditorMode.updateMode.bind(this._currentEditorMode));
                }
                break;

            case EEditorMode.ItemViewer:
                {
                    this._currentEditorMode = new EditorMode_ItemViewer(this);
                    this._currentEditorModeUpdateObserver = this._scene.onBeforeRenderObservable.add(this._currentEditorMode.updateMode.bind(this._currentEditorMode));
                }
                break;

            case EEditorMode.EquipEditor:
                {
                    this._currentEditorMode = new EditorMode_EquipEditor(this);
                    this._currentEditorModeUpdateObserver = this._scene.onBeforeRenderObservable.add(this._currentEditorMode.updateMode.bind(this._currentEditorMode));
                }

        }

        this._currentEditorMode?.startMode();
    }

    //-----------------------------------------------------------------------------------
    // 툴지원
    //-----------------------------------------------------------------------------------
    public registerIpcChannelEventListerner_Editor() {
        ipcRenderer.on(EditorConstants.IPC_CHANNEL_TOGGLE_DEBUG_LAYER, () => {
            this.toggleDebugLayer();
        });

        ipcRenderer.on(EditorConstants.IPC_CHANNEL_SAVE, () => {
            this._currentEditorMode?.executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_SAVE_ALL);
        });
    }

    public toggleDebugLayer(): void {
        if (this._scene) {
            this._scene.debugLayer.isVisible() ? this._scene.debugLayer.hide() : this._scene.debugLayer.show();
        }
    }

    public setEditorMode(mode: string): void {
        console.log("setEditorMode", mode);
    }


    public _initializeDragDropMonitor(): void {
        const canvas = this._scene.getEngine().getRenderingCanvas();
        if (canvas) {
            this._dragDropMonitor = new DragDropMonitor((filepaths: string[]) => {
                if (this._currentEditorMode) {
                    this._currentEditorMode.openFiles(filepaths);
                }
            });
            this._dragDropMonitor.monitorElementForDragNDrop(canvas);
        }
    }


    //-----------------------------------------------------------------------------------
    // Static functions
    //-----------------------------------------------------------------------------------
    public static getInstance(): EditorApp {
        return EditorApp._instance;
    }
}