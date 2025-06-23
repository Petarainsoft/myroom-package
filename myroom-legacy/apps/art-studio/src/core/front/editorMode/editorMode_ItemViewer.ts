import * as BABYLON from "@babylonjs/core";
import { EditorApp } from "../editorApp";
import { EEditorMode, EditorModeBase } from "./editorModeBase";
import { ModelControllerBase, ModelController_ItemViewer, ModelController_MaterialEditor } from "./modelController";
import { ItemData } from "client-core/tableData/defines/System_Interface";
import { EItemCategory1 } from "client-core";
import { EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import { Logger } from "../logger";

class EditorMode_ItemViewer extends EditorModeBase {
    public constructor(editor: EditorApp) {
        super(editor);
        this._editorMode = EEditorMode.ItemViewer;
    }

    protected _makeModelController(name: string, scene: BABYLON.Scene, assetDirForTool: string): ModelControllerBase {
        return new ModelController_ItemViewer(name, scene, assetDirForTool);
    }

    protected _onModelControllerLoaded(): void {
        this._fitCameraToModel();
    }

    public startMode(): void {
        console.log("EditorMode_ItemViewer startMode");
    }

    public endMode(): void {

    }

    public updateMode(): void {

    }

    public executeCommand(command: string, ...args: any[]): void {
    }

    protected override _clearScene() {
        //clear 하지 않는다 중복 모델 로딩을 위해
    }

    protected override _checkSupportedItemType(itemData: ItemData): boolean {
        switch (itemData.category1) {
            case EItemCategory1.AVATAR:
            case EItemCategory1.MYROOMSKIN:
            case EItemCategory1.MYROOMITEM:
                return true;
        }

        switch (itemData.category3) {
            case EItemCategory3.AVATERPRESET:
            case EItemCategory3.INDOORCOORDITEMPLETE:
            case EItemCategory3.OUTDOORCOORDITEMPLETE:
                return true;
        }

        return false;
    }
}

export { EditorMode_ItemViewer };