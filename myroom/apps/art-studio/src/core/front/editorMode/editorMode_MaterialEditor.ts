import * as BABYLON from "@babylonjs/core";
import { ipcRenderer } from "electron";
import { EnvironmentController, TableDataManager } from "client-core";
import { EditorApp } from "../editorApp";
import { EEditorMode, EditorModeBase } from "./editorModeBase";
import * as path from "path";
import { EItemCategory1, EItemCategory2, EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import { ItemData } from "client-core/tableData/defines/System_Interface";
import { Logger } from "../logger";
import { ModelControllerBase, ModelController_MaterialEditor } from "./modelController";
import { CameraController } from "client-core/assetSystem/controllers/cameraController";
import { IItemExplorerDatas } from "@/components/ItemExplorer/itemExplorerComponent";
import { Material } from "@babylonjs/core";
import { ENodeMaterialType } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Material';

class EditorMode_MaterialEditor extends EditorModeBase {
    public constructor(editor: EditorApp) {
        super(editor);
        this._editorMode = EEditorMode.MaterialEditor;
    }

    protected _makeModelController(name: string, scene: BABYLON.Scene, assetDirForTool: string): ModelControllerBase {
        return new ModelController_MaterialEditor(name, scene, assetDirForTool);
    }

    protected _onModelControllerLoaded(): void {
        this._fitCameraToModel();
        const itemExplorerData = this._makeCurrentModelItemExplorerData();
        this._getUIController().rebuildTreeView(itemExplorerData);
    }

    public startMode(): void {
        console.log("EditorMode_MaterialEditor startMode");
    }

    public endMode(): void {

    }

    public updateMode(): void {

    }

    //-----------------------------------------------------------------------------------
    // Command 처리 관련
    //-----------------------------------------------------------------------------------
    public static readonly EDITOR_COMMAND_SAVE_ALL = "saveAll";
    public static readonly EDITOR_COMMAND_CREATE_NEW_NODE_MATERIAL = "createNewNodeMaterial";
    public static readonly EDITOR_COMMAND_DELETE_NODE_MATERIAL = "deleteNodeMaterial";
    public static readonly EDITOR_COMMAND_ASSIGN_MATERIAL = "assignMaterial";
    public static readonly EDITOR_COMMAND_REFRESH_UI = "refreshUI";
    public static readonly EDITOR_COMMAND_CREATE_CLONE_MATERIAL = "createCloneMaterial";

    public executeCommand(command: string, ...args: any[]): void {
        switch (command) {
            case EditorMode_MaterialEditor.EDITOR_COMMAND_SAVE_ALL:
                {
                    this._getModelController()?.saveAll();
                    const itemExplorerData = this._makeCurrentModelItemExplorerData();
                    this._getUIController().rebuildTreeView(itemExplorerData);
                }
                break;

            case EditorMode_MaterialEditor.EDITOR_COMMAND_CREATE_NEW_NODE_MATERIAL:
                if (args.length > 0) {
                    const nodeMaterialType: ENodeMaterialType = args[0];
                    this._getModelController()?.createNewNodeMaterial(nodeMaterialType);
                    const itemExplorerData = this._makeCurrentModelItemExplorerData();
                    this._getUIController().rebuildTreeView(itemExplorerData);
                }
                break;

            case EditorMode_MaterialEditor.EDITOR_COMMAND_DELETE_NODE_MATERIAL:
                if (args.length == 1) {
                    const materialName = args[0];
                    this._getModelController()?.deleteNodeMaterial(materialName);
                    const itemExplorerData = this._makeCurrentModelItemExplorerData();
                    this._getUIController().rebuildTreeView(itemExplorerData);
                }
                break;

            case EditorMode_MaterialEditor.EDITOR_COMMAND_ASSIGN_MATERIAL:
                if (args.length == 2) {
                    const targetMeshPath = args[0];
                    const materialName = args[1];
                    this._getModelController()?.assignNodeMaterial(targetMeshPath, materialName);
                    const itemExplorerData = this._makeCurrentModelItemExplorerData();
                    this._getUIController().rebuildTreeView(itemExplorerData);
                }
                break;

            case EditorMode_MaterialEditor.EDITOR_COMMAND_REFRESH_UI:
                {
                    const itemExplorerData = this._makeCurrentModelItemExplorerData();
                    this._getUIController().rebuildTreeView(itemExplorerData);
                }
                break;

            case EditorMode_MaterialEditor.EDITOR_COMMAND_CREATE_CLONE_MATERIAL:
                {
                    if (args.length == 1) {
                        const targetMeshPath = args[0];
                        this._getModelController()?.createCloneMaterial_PBR(targetMeshPath);
                        const itemExplorerData = this._makeCurrentModelItemExplorerData();
                        this._getUIController().rebuildTreeView(itemExplorerData);
                    }
                }
                break;
        }
    }

    private _makeCurrentModelItemExplorerData(): IItemExplorerDatas {
        const ret: IItemExplorerDatas = { itemName: "", meshes: [], materials: [], textures: [] };

        //itemName
        ret.itemName = this._currentModelController!.name;

        //Meshes
        ret.meshes = this._getModelController()!.getAllUsingMeshes().filter(m => { return m.name !== "__root__"; }).map(m => {
            return {
                type: "Mesh",
                name: m.name,
                uniqueId: m.uniqueId.toString(),
                object: m,
                reservedDataStore: {}
            };
        });

        //Materials
        ret.materials = this._getModelController()!.getAllUsingMaterialInfos().map(m => {
            return {
                type: "Material",
                name: m.name,
                uniqueId: m.name,
                object: m,
                reservedDataStore: {}
            };
        });

        //textures
        ret.textures = this._getModelController()!.getAllUsingTextures().map(t => {
            return {
                type: "Texture",
                name: t.name,
                uniqueId: t.name,
                object: t,
                reservedDataStore: {}
            };
        });

        return ret;
    }

    private _getModelController(): ModelController_MaterialEditor {
        return this._currentModelController as ModelController_MaterialEditor;
    }

}

export { EditorMode_MaterialEditor as EditorMode_ItemEditor };