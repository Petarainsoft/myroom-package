import * as BABYLON from "@babylonjs/core";
import { App } from "electron";
import { EditorApp } from "../editorApp";
import { ItemController } from "client-core";
import { MyRoomContext } from "client-core/assetSystem/myRoomContext";
import { IAssetLoader } from "client-core/assetSystem/definitions";
import { ModelControllerBase, ModelController_MaterialEditor } from "./modelController";
import { UIController } from "../uiController/uiController";

import { ipcRenderer } from "electron";
import { EnvironmentController, TableDataManager } from "client-core";
import * as path from "path";
import { EItemCategory1, EItemCategory2, EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import { ItemData } from "client-core/tableData/defines/System_Interface";
import { Logger } from "../logger";
import { CameraController } from "client-core/assetSystem/controllers/cameraController";
import { IItemExplorerDatas } from "@/components/ItemExplorer/itemExplorerComponent";
import { Material } from "@babylonjs/core";
import { ENodeMaterialType } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Material';

export enum EEditorMode {
    None = "None",
    ItemViewer = "ItemViewer",
    MaterialEditor = "MaterialEditor",
    EquipEditor = "EquipEditor",
}

export const stringToEditorMode = (str: string): EEditorMode => {
    if (str === EEditorMode.ItemViewer) {
        return EEditorMode.ItemViewer;
    }
    else if (str === EEditorMode.MaterialEditor) {
        return EEditorMode.MaterialEditor;
    }
    else if (str === EEditorMode.EquipEditor) {
        return EEditorMode.EquipEditor;
    }

    return EEditorMode.None;
};

export abstract class EditorModeBase {
    protected _editor: EditorApp;
    protected _editorMode: EEditorMode = EEditorMode.None;
    protected _currentModelController: ModelControllerBase | null = null;
    protected _assetDirForTool: string = "";

    public getToolModelController() {
        return this._currentModelController;
    }

    public getAssetDirForTool(): string {
        return this._assetDirForTool;
    }


    public get editorMode(): EEditorMode { return this._editorMode; }

    public constructor(eidtor: EditorApp) {
        this._editor = eidtor;
    }

    public abstract startMode(): void;
    public abstract endMode(): void;
    public abstract updateMode(): void;
    public abstract executeCommand(command: string, ...args: any[]): void;
    protected abstract _makeModelController(name: string, scene: BABYLON.Scene, assetDirForTool: string): ModelControllerBase | null;
    protected abstract _onModelControllerLoaded(): void;

    public openFiles(files: string[]): void {
        this._clearScene();

        if (this._getAssetLoader() === null) {
            return;
        }


        if (files.length > 0) {
            const extName = path.extname(files[0]);
            const clientId = extName !== "" ? path.basename(path.dirname(files[0])) : path.basename(files[0]);
            this._assetDirForTool = extName !== "" ? path.dirname(files[0]) : files[0];
            let itemData = TableDataManager.getInstance().findItemByClientID(clientId);
            if (!itemData) {
                //아이템이 없을경우 툴지원을 위해 가상의 아이템을 Table에 추가해 주자
                const upperDir = path.basename(path.dirname(this._assetDirForTool));
                const fakeItemId = this._makeFakeItemId();
                const category = this._getCategoryFromItemData(upperDir);
                ipcRenderer.invoke('electron:addFakeItemData', fakeItemId, category.category1, category.category2, category.category3, clientId); //AssetServer가 사용하는 TableDataManager 수정

                TableDataManager.getInstance().addFakeItemDataForTool(fakeItemId, category.category1, category.category2, category.category3, clientId);
                itemData = TableDataManager.getInstance().findItemByClientID(clientId);
            }

            if (itemData && this._checkSupportedItemType(itemData)) {
                this._currentModelController = this._makeModelController(itemData.client_itemid, this._getScene(), this._assetDirForTool);
                this._currentModelController?.init();
                this._currentModelController?.loadModel(itemData.ID, this._getAssetLoader()!).then(() => {
                    this._onModelControllerLoaded();
                });
            }
            else {
                if (!itemData) {
                    Logger.error("아이템을 찿을수 없습니다");
                }
                else {
                    Logger.error("지원하지 않는 아이템 타입입니다.");
                }
            }
        }
    }


    protected _getEditor(): EditorApp {
        return this._editor;
    }

    protected _getScene(): BABYLON.Scene {
        return this._editor.getScene();
    }

    protected _getRoomContext(): MyRoomContext {
        return this._editor.getRoomContext();
    }

    protected _getAssetLoader(): IAssetLoader | null {
        return this._editor.getAssetLoader();
    }

    protected _getCamera(): BABYLON.ArcRotateCamera {
        return this._getScene().activeCamera as BABYLON.ArcRotateCamera;
    }

    protected _getUIController(): UIController {
        return this._editor.getUIController();
    }

    protected _fitCameraToModel(): void {
        const camera = this._getCamera();
        if (camera) {
            //camera.target = target.getBoundingInfo().boundingBox.centerWorld;
            //this._getCamera().radius = this._calcualteCameraRadius(target);
            const worldExtends = this._getWorldExtends((mesh) => mesh.isVisible && mesh.isEnabled());
            const worldSize = worldExtends.max.subtract(worldExtends.min);
            const worldCenter = worldExtends.min.add(worldSize.scale(0.5));
            let radius = worldSize.length() * 1.5;
            if (!isFinite(radius)) {
                radius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }
            this._getCamera().radius = radius;
            this._getCamera().lowerRadiusLimit = radius * 0.01;
            this._getCamera().wheelPrecision = 100 / radius;

            this._getCamera().alpha = Math.PI / 2;
            this._getCamera().beta = Math.PI / 2;

            this._getCamera().minZ = radius * 0.01;
            this._getCamera().maxZ = radius * 1000;
            this._getCamera().speed = radius * 0.2;

            this._getCamera().target = worldCenter;

            camera.useFramingBehavior = true;
            const framingBehavior = camera.getBehaviorByName("Framing") as BABYLON.FramingBehavior;
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            if (this._getScene().meshes.length) {
                camera.lowerRadiusLimit = null;

                const worldExtends = this._getScene().getWorldExtends(function (mesh) {
                    return mesh.isVisible && mesh.isEnabled();
                });
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);

                console.log("worldExtends.min = " + worldExtends.min + " worldExtends.max = " + worldExtends.max);
            }

            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;

            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
            camera.lowerRadiusLimit = radius * 0.01;
        }
    }

    protected _calcualteCameraRadius(target: ModelControllerBase): number {

        const bound = target.getBoundingInfo();
        const radius = bound.boundingSphere.radiusWorld;
        const aspectRatio = this._getScene().getEngine().getAspectRatio(this._getCamera());
        let halfMinFov = this._getCamera().fov / 2;
        if (aspectRatio < 1) {
            halfMinFov = Math.atan(aspectRatio * Math.tan(this._getCamera().fov / 2));
        }
        const cameraRadius = Math.abs(radius / Math.sin(halfMinFov));
        return cameraRadius;
    }

    protected _getWorldExtends(filterPredicate?: (mesh: BABYLON.AbstractMesh) => boolean): { min: BABYLON.Vector3; max: BABYLON.Vector3; } {
        const min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        filterPredicate = filterPredicate || (() => true);
        this._getScene().meshes.filter(filterPredicate).forEach((mesh) => {
            mesh.computeWorldMatrix(true);

            if (!mesh.subMeshes || mesh.subMeshes.length === 0 || mesh.infiniteDistance) {
                return;
            }

            const boundingInfo = mesh.getBoundingInfo();

            const minBox = boundingInfo.boundingBox.minimumWorld;
            const maxBox = boundingInfo.boundingBox.maximumWorld;

            BABYLON.Vector3.CheckExtends(minBox, min, max);
            BABYLON.Vector3.CheckExtends(maxBox, min, max);
        });

        return {
            min: min,
            max: max,
        };
    }



    protected _clearScene() {
        this._assetDirForTool = "";
        this._currentModelController?.dispose();
        this._currentModelController = null;

        this._getScene().meshes.forEach(m => {
            m.dispose(false, true);
        });

        this._getScene().transformNodes.forEach(t => {
            if (!t.name.startsWith("[") && t.name !== "환경설정") {
                t.dispose(false, true);
            }
        });

        this._getScene().lights.forEach(l => {
            if (!l.name.startsWith("[")) {
                l.dispose();
            }
        });
    }

    protected _checkSupportedItemType(itemData: ItemData): boolean {
        switch (itemData.category1) {
            case EItemCategory1.AVATAR:
            case EItemCategory1.MYROOMSKIN:
            case EItemCategory1.MYROOMITEM:
                return true;
        }

        return false;
    }

    protected _makeFakeItemId(): string {
        return "fake_" + Date.now().toString();
    }

    protected _getCategoryFromItemData(upperDir: string): { category1: EItemCategory1, category2: EItemCategory2, category3: EItemCategory3; } {
        if (upperDir === "AVATAR_RESOURCE") {
            return { category1: EItemCategory1.AVATAR, category2: EItemCategory2.HEAD, category3: EItemCategory3.HAIR }; //구분할 필요없다
        }
        else if (upperDir === "MYROOM_ITEM") {
            return { category1: EItemCategory1.MYROOMITEM, category2: EItemCategory2.FLOOR, category3: EItemCategory3.FUNITURE };
        }
        else if (upperDir === "SYSTEM_AVATAR") {
            return { category1: EItemCategory1.SYSTEMITEM, category2: EItemCategory2.SYSTEMAVATAR, category3: EItemCategory3.AVATERPRESET };
        }

        console.error("_getCategory3FromItemData(): Not supported category3" + upperDir);
        return { category1: EItemCategory1.SYSTEMITEM, category2: EItemCategory2.SYSTEMMYROOM, category3: EItemCategory3.SYSTEMMYROOMEMV };
    }
}