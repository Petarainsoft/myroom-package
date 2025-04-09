
import * as BABYLON from "@babylonjs/core";
import { IAssetLoader, ITableDataManager, eAssetType } from "../definitions"
import { TableDataManager } from "../../tableData/tableDataManager";
import { ItemData } from "../../tableData/defines/System_Interface";
import { EPlacementAttachType } from "../../tableData/defines/System_Enum";

export class ItemViewerController extends BABYLON.TransformNode {

    private _assetLoader: IAssetLoader
    private _tableManager: ITableDataManager

    private _loadExcelItemId: string = "";
    set loadExcelItemId(value) { this._loadExcelItemId = value; }
    get loadExcelItemId() { return this._loadExcelItemId; }

    private _loadAvatarId: string = "";
    set loadAvatarId(value) { this._loadAvatarId = value; }
    get loadAvatarId() { return this._loadAvatarId; }

    private _loadMyRoomId: string = "";
    set loadMyRoomId(value) { this._loadMyRoomId = value; }
    get loadMyRoomId() { return this._loadMyRoomId; }

    public constructor(scene: BABYLON.Nullable<BABYLON.Scene>, assetLoader: IAssetLoader) {
        super(`ItemViewer`, scene)

        this.parent = null;
        this._assetLoader = assetLoader
        this._tableManager = new TableDataManager();
        this._tableManager.loadTableDatas();

        this._createCustomProperies_Panel();
    }

    private _createCustomProperies_Panel() {
        this.inspectableCustomProperties = [];

        this.inspectableCustomProperties.push(
            {
                label: "Excel Item ID",
                propertyName: "loadExcelItemId",
                type: BABYLON.InspectableType.String,
            })
        this.inspectableCustomProperties.push(
            {
                label: "Load Excel Item",
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: async () => {
                    await this._loadExcelItem_byItemId(this.loadExcelItemId);
                },
            })

        this.inspectableCustomProperties.push(
            {
                label: "DB Avatar ID",
                propertyName: "loadAvatarId",
                type: BABYLON.InspectableType.String,
            })
        this.inspectableCustomProperties.push(
            {
                label: "Load Avatar",
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: () => {
                    this._loadAvatar(this.loadAvatarId);
                },
            })

        this.inspectableCustomProperties.push(
            {
                label: "DB MyRoom ID",
                propertyName: "loadMyRoomId",
                type: BABYLON.InspectableType.String,
            })
        this.inspectableCustomProperties.push(
            {
                label: "Load MyRoom",
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: () => {
                    this._loadMyRoom(this.loadMyRoomId);
                },
            })
    }

    private async _loadExcelItem_byItemId(itemId: string) {
        console.log(`ItemViewerController::_loadExcelItem_byItemId() target item id => ${itemId}`);

        const item = this._tableManager.findItem(itemId);
        if (item) {
            this._test_log(item);
        }
        else {
            console.error(`ItemViewerController::_loadExcelItem_byItemId() not found ItemData. target item id => ${itemId}`);
        }

        await this._assetLoader.loadAssetIntoScene(eAssetType.Model_glb, itemId);
    }

    private _test_log(item: ItemData) {
        console.log(`[item] itemid='${item.ID}', ${JSON.stringify(item)}`);
        console.log(`[hashtag .len] ${item.hashtag}, => ${item.hashtag.length}`);
        // console.log(`[hasGrid] ${item.hasGrid}, => ${(item.hasGrid ? "ttt" : "fff")}`);
        // console.log(`[gridOrigin .len] ${item.gridOrigin}, => ${item.gridOrigin.length}`);
        // console.log(`[gridMarkArray .len] ${item.gridMarkArray}, => ${item.gridMarkArray.length}`);
        console.log(`[placement_attach_type] ${item.placement_attach_type}, => ${item.placement_attach_type}, ${EPlacementAttachType[item.placement_attach_type]}`);
        console.log(`[useGrids] ${item.useGrids}, => ${JSON.stringify(item.useGrids)}, => ${item.useGrids.length}`);
    }

    private _loadAvatar(itemId: string) {
        console.log(`ItemViewerController::_loadAvatar() target item id => ${itemId}`);

        this._assetLoader.loadAssetIntoScene(eAssetType.Avatar, itemId);
    }

    private _loadMyRoom(itemId: string) {
        console.log(`ItemViewerController::_loadMyRoom() target item id => ${itemId}`);

        this._assetLoader.loadAssetIntoScene(eAssetType.MyRoom, itemId);
    }
}