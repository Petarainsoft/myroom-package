import * as BABYLON from "@babylonjs/core";
import { MyRoomCommandQueue } from "./myRoomCommand";
import { MyRoomAPI } from "./myRoomAPI";

export interface IMyRoomCommandRecordingData {
    time?: number,
    commandName: string,
    param?: any;
}

export class MyRoomCommandRecorder {
    private static _instance: MyRoomCommandRecorder;

    private _api: MyRoomAPI;
    private _startTime: number;
    private _commandDatas: IMyRoomCommandRecordingData[] = [];
    private _startPlay: boolean = false;

    public static getInstance(): MyRoomCommandRecorder {
        return this._instance;
    }

    public static createInstance(api: MyRoomAPI) {
        if (MyRoomCommandRecorder._instance) {
            console.error(">>>> 레코드가 중복 생성 되었습니다. 확인해 주세요!!!");
            return;
        }

        new MyRoomCommandRecorder(api);
        console.log(">>>> Recorder Enabled");

    }

    public static isValid(): boolean {
        return this._instance ? true : false;
    }

    private constructor(api: MyRoomAPI) {
        MyRoomCommandRecorder._instance = this;
        this._api = api;
        this._startTime = new Date().getTime();
    }

    public addCommand_Api(commandData: IMyRoomCommandRecordingData) {
        if (!this._startPlay) {
            commandData.time = new Date().getTime() - this._startTime;
            this._commandDatas.push(commandData);
        }
    }

    public addCommand_InputAction(commandData: IMyRoomCommandRecordingData) {
        if (!this._startPlay) {
            commandData.time = new Date().getTime() - this._startTime;
            this._commandDatas.push(commandData);
            console.log(commandData);
            console.log(JSON.stringify(commandData));
        }
    }

    public startReplay() {
        this._startTime = new Date().getTime();
        this._startPlay = true;
        console.log(">>>> start replay recoding datas");
    }

    public processRecodingDatas() {
        if (!this._startPlay) {
            return;
        }

        while (this._commandDatas.length > 0) {
            const data = this._commandDatas[0];
            if ((this._startTime + (data.time ? data.time : 0)) <= new Date().getTime()) {
                this._commandDatas.shift();
                this._processRecordingData(data);
            }
            else {
                break;
            }
        }
    }

    public saveRecordingDatas() {
        const recDatas = JSON.stringify(this._commandDatas, undefined, 4);
        const blob = new Blob([recDatas], { type: "application/json" });
        BABYLON.Tools.Download(blob, "roomCommandRec.json");
    }

    public loadRecordingDatas(file: File) {
        this._commandDatas = [];
        BABYLON.Tools.ReadFile(file, (data) => {
            this._commandDatas = JSON.parse(data) as IMyRoomCommandRecordingData[];
            console.log(`>>>> recoding data loaded!! (${this._commandDatas.length})`);
            this._commandDatas.forEach((d) => { console.log(d); });
        });
    }

    private _processRecordingData(data: IMyRoomCommandRecordingData) {
        console.log(`>>>> processing RecordingData ${data.commandName}`);
        switch (data.commandName) {
            //공통 : ----------------------------------------------------------------------
            case "initialize":
                this._api.initialize();
                break;
            case "finalize":
                this._api.finalize();
                break;

            case "createScreenShot":
                this._api.createScreenShot(data.param.size, (d) => { });
                break;

            //MyRoom : ------------------------------------------------------------------
            case "initializeMyRoom":
                //{ commandName: "initializeMyRoom", param: { roomManifest, forRoomCoordi } }
                this._api.initializeMyRoom(data.param.roomManifest, data.param.forRoomCoordi);
                break;

            case "clearMyRoom":
                this._api.clearMyRoom();
                break;

            case "changeRoomSkin":
                this._api.changeRoomSkin(data.param.roomManifest);
                break;

            case "getMyRoomMode":
                this._api.getMyRoomMode((mode) => { });
                break;

            case "getMyRoomController":
                this._api.getMyRoomController((controller) => { });
                break;

            case "startMyRoomPlacementMode":
                this._api.startMyRoomPlacementMode();
                break;

            case "endMyRoomPlacementMode":
                this._api.endMyRoomPlacementMode();
                break;

            case "getAllFigureIds":
                this._api.getAllFigureIds((ids) => { });
                break;

            case "getAllItemIds":
                this._api.getAllItemIds((ids) => { });
                break;

            case "getAllItemInstanceIds":
                this._api.getAllItemInstanceIds((ids) => { });
                break;

            case "setBackgroundColor":
                //{ commandName: "setBackgroundColor", param: { hexColor } }
                this._api.setBackgroundColor(data.param.hexColor);
                break;

            case "placeNewItem":
                //{ commandName: "placeNewItem", param: { itemId } }
                this._api.placeNewItem({ "itemId": data.param.itemId, itemInstanceId: data.param.itemInstanceId, callback: () => { } });
                break;

            case "removeItem":
                //{ commandName: "removeItem", param: { itemInstanceId } }
                this._api.removeItem(data.param.itemInstanceId);
                break;

            case "removeItemsByItemId":
                //{ commandName: "removeItemsByItemId", param: { itemId } }
                this._api.removeItemsByItemId({ "itemId": data.param.itemId, callback: () => { } });
                break;

            case "placeNewFigure":
                //{ commandName: "placeNewFigure", param: { figureId, isAvatar } }
                this._api.placeNewFigure(data.param.figureId, data.param.isAvatar);
                break;

            case "removeFigure":
                //{ commandName: "removeFigure", param: { figureId } }
                this._api.removeFigure(data.param.figureId);
                break;

            case "rotateSelectedItemOrFigure":
                this._api.rotateSelectedItemOrFigure();
                break;

            case "deselectTarget":
                this._api.deselectTarget();
                break;

            case "makeMyRoomManifest":
                this._api.makeMyRoomManifest((manifest) => { });
                break;

            case "doItemFunction_MyRoom":
                //{ commandName: "doItemFunction_MyRoom", param: { instanceId, data } }
                this._api.doItemFunction_MyRoom(data.param.instanceId, data.param.data);
                break;

            case "findItemController":
                //{ commandName: "findItemController", param: { itemInstanceId } }
                this._api.findItemController(data.param.itemInstanceId, (con) => { });
                break;

            case "findItemControllersByItemId":
                //{ commandName: "findItemControllersByItemId", param: { itemId } }
                this._api.findItemControllersByItemId(data.param.itemId, (con) => { });
                break;

            case "findAvatarController":
                //{ commandName: "findAvatarController", param: { avatarId } }
                this._api.findAvatarController(data.param.avatarId, (con) => { });
                break;

            case "createOutsideFigures":
                this._api.createOutsideFigures(data.param.figures);
                break;

            case "refreshFigureModels":
                this._api.refreshFigureModels(data.param.avatarIds);
                break;

            case "startRoom":
                this._api.startRoom();
                break;

            //Avatar: -------------------------------------------------------------------
            case "initializeAvatar":
                //{commandName:"initializeAvatar",param:{avatarId,manifest}}
                this._api.initializeAvatar(data.param.avatarId, data.param.manifest);
                break;

            case "clearAvatar":
                this._api.clearAvatar();
                break;

            case "setDefaultAvatarCamera":
                this._api.setDefaultAvatarCamera();
                break;

            case "equipAvatarItem":
                //{ commandName: "equipAvatarItem", param: { itemId } }
                this._api.equipAvatarItem(data.param.itemId, (oldItemId: string | undefined) => { });
                break;

            case "unequipAvatarItem":
                //{ commandName: "unequipAvatarItem", param: { itemId, exchange, isWebCall } }
                this._api.unequipAvatarItem(data.param.itemId, data.param.exchange, data.param.isWebCall);
                break;

            case "unequipAllAvatarItem":
                this._api.unequipAllAvatarItem();
                break;

            case "getAllAvatarEquipItems":
                this._api.getAllAvatarEquipItems((items) => { });
                break;

            case "playAnimation":
                //{ commandName: "playAnimation", param: { itemId, playAniTag } }
                this._api.playAnimation(data.param.itemId, data.param.playAniTag);
                break;

            case "makeAvatarManifest":
                this._api.makeAvatarManifest((manifiest) => { });
                break;

            case "setFaceMorphValues":
                this._api.setFaceMorphValues(data.param.data);
                break;

            case "applyHeadRotation":
                this._api.applyHeadRotation(data.param.head, data.param.pitch, data.param.yaw);
                break;

            //Item : --------------------------------------------------------------------
            case "initializeItem":
                //{ commandName: "initializeItem", param: { itemId } }
                this._api.initializeItem(data.param.itemId);
                break;

            case "getItemController":
                this._api.getItemController((con) => { });
                break;

            case "clearItem":
                this._api.clearItem();
                break;

            case "doItemFunction":
                //{ commandName: "doItemFunction", param: { data } }
                this._api.doItemFunction(data.param.data);
                break;

            //inputForReplay ------------------------------------------------------------
            case "InputAction_SelectTarget":
            case "InputAction_ClearTarget":
            case "InputAction_RemoveItem":
            case "InputAction_MoveItem":
            case "InputAction_DestroyItem":
            case "InputAction_RemoveFigure":
            case "InputAction_MoveFigure":
            case "InputAction_DestroyFigure":
                this._api.handleRecordingData(data);
                break;

            //---------------------------------------------------------------------------
            default:
                console.error(`MyRoomCommandRecorder._dataReplayHandler() : no handler check!!! ,${data.commandName}`);
        }
    }
}