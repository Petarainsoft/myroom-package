import * as BABYLON from "@babylonjs/core";
import { AssetLoader } from "./assetSystem/loader/assetLoader";
import { TableDataManager } from "./tableData/tableDataManager";
import { ECameraMode } from "./assetSystem/controllers/cameraController";
import { EMyRoomMode, MyRoomController } from "./assetSystem/controllers/myRoomController";
import { IAssetManifest_MyRoom, IMyRoomItemFunctionData, IOutsideFigureInfo } from "./assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import { SelectionInfo, DragInfo } from "./assetSystem/controllers/roomSubSystem/InputHandler_PlaceMode";
import { AvatarController } from "./assetSystem/controllers/avatarController";
import { IAssetManifest_Avatar } from "./assetSystem/jsonTypes/manifest/assetManifest_Avatar";
import { ItemController } from "./assetSystem/controllers/itemController";
import { MyRoomContext } from "./assetSystem/myRoomContext";
import { ItemData } from "./tableData/defines/System_Interface";
import { MyRoomCommandQueue } from "./myRoomCommand";
import { ConstantsEx } from "./assetSystem/constantsEx";
import { IMyRoomCommandRecordingData } from "./myRoomCommandRecorder";
import { Constants } from "./assetSystem/constants";
import { ISetFaceMorphData } from "./assetSystem/definitions";
import { RemoveInfo } from "./assetSystem/controllers/roomSubSystem/ItemPlacementManager"

const RENDER_PERIOD_NORMAL = 3; // touch 동작이 없을때는 20 fps로 (60/3)
const RENDER_PERIOD_ACTIVE = 2; // touch 동작이 있을때는 30 fps로 (60/2)
const RENDER_PERIOD_FULL = 1;
export class MyRoomAPI {
    private _scene: BABYLON.Nullable<BABYLON.Scene> = null;
    private _assetLoader: BABYLON.Nullable<AssetLoader> = null;
    private _tableManager: BABYLON.Nullable<TableDataManager> = null;
    private _myRoomController: BABYLON.Nullable<MyRoomController> = null;
    private _avatarController: BABYLON.Nullable<AvatarController> = null;
    private _itemController: BABYLON.Nullable<ItemController> = null;
    private _context: BABYLON.Nullable<MyRoomContext> = null;

    private _cmdQueue: MyRoomCommandQueue;
    private _cmdUpdateObserver: BABYLON.Observer<BABYLON.Scene> | null = null;

    private _renderPeriod: number = 1;
    private _pointerObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>> = null;
    private _blockChangeRenderLoopByPointer: boolean = false;

    private _optimzeGlowTimerId:number|null = null;

    public getContext(): BABYLON.Nullable<MyRoomContext> {
        return this._context;
    }

    public loadRecordingData(file: File) {
        this._cmdQueue.loadRecordingData(file);
    }

    public playRecordingData() {
        this._cmdQueue.playRecordingData();
    }

    public handleRecordingData(data: IMyRoomCommandRecordingData) {
        const myRooomController = this._getMyRoomController();
        if (myRooomController) {
            myRooomController.handleRecordingData(data);
        }
    }

    public constructor(scene: BABYLON.Scene, renderPeriod?: number, recording: boolean = false) {
        console.log("🚀 [Khởi tạo MyRoomAPI] recoariing " + recording);
    
        this._cmdQueue = new MyRoomCommandQueue(scene, this, recording);
        this._scene = scene;
    
        if (this._scene) {
            console.log("✅ Đã nhận được scene");
    
            this._cmdUpdateObserver = this._scene.onBeforeRenderObservable.add(() => {
                // console.log("🚀 [My room api] => UpdateCommands()");
                this._cmdQueue.updateCommands();
            });
            console.log("🌀 Đã đăng ký updateCommands vào onBeforeRender");
    
            const changeRenderLoopFunc = (isActive: boolean) => {
                if (isActive) {
                    console.log("⚡️ Chuyển sang chế độ render nhanh (active)");
                    this._blockChangeRenderLoopByPointer = true;
                    this.changeRenderLoop(RENDER_PERIOD_ACTIVE);
                } else {
                    console.log("⏸ Chuyển sang render bình thường");
                    this._blockChangeRenderLoopByPointer = false;
                    this.changeRenderLoop(RENDER_PERIOD_NORMAL);
                }
            };
    
            this._context = new MyRoomContext(this._scene, changeRenderLoopFunc);
            console.log("🧠 Đã tạo context");
    
            this._assetLoader = new AssetLoader(this._context, this._scene);
            console.log("📦 AssetLoader đã sẵn sàng");
    
            this.changeRenderLoop(renderPeriod ?? RENDER_PERIOD_NORMAL);
            console.log(`🎯 Thiết lập renderLoop mặc định: ${renderPeriod ?? RENDER_PERIOD_NORMAL}`);
    
            // Thêm sự kiện bàn phím cho test
            scene?.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type) {
                    case BABYLON.KeyboardEventTypes.KEYDOWN:
                        if (kbInfo.event.key == ';') {
                            console.log("👤 Thêm avatar thử nghiệm vào scene");
                            this.createOutsideFigures([{ avatarId: "BJx99yaC9R2kLsy438O0m" }, { avatarId: "IrvFJ4wylmgdhEFFo3xTc" }, { avatarId: "1szaJD9tmPUrWhZMxEYBE" }, { avatarId: "5eyfya3KN14GSt9EofNuy" }, { avatarId: "9QxheDXOc1JzeBSdmFYoq" }, { avatarId: "DCwlAk5KEQ3wAMummtBhY" }, { avatarId: "GyvjIemJAzT8B1ID80exs" }, { avatarId: "KkupcDhr2IUu8NnpGIXZo" }]);
                        } else if (kbInfo.event.key == '1') {
                            console.log("🔍 Mở Babylon Inspector");
                            void Promise.all([
                                import("@babylonjs/core/Debug/debugLayer"),
                                import("@babylonjs/inspector"),
                            ]).then((_values) => {
                                this._scene!.debugLayer.show({
                                    handleResize: true,
                                    overlay: true,
                                    globalRoot: document.getElementById("#root") || undefined,
                                });
                            });
                        } else if (kbInfo.event.key == '3') {
                            console.log("📊 Thông tin render engine:", this._scene?.getEngine().getRenderWidth(false), this._scene?.getEngine().getRenderWidth(true), this._scene?.getEngine()._hardwareScalingLevel);
                        }
                        break;
                }
            });
    
            console.log("⌨️ Đăng ký sự kiện bàn phím test hoàn tất");
        } else {
            console.error("❌ MyRoomAPI:constructor - KHÔNG CÓ scene truyền vào!");
        }
    }

    //-----------------------------------------------------------------------------------
    // 공통
    //-----------------------------------------------------------------------------------
    public async initialize() {
        const api: () => Promise<void> = () => {
            if (this._scene) {

                this._registerPointerHandlers();

                if (TableDataManager.getInstance() && TableDataManager.getInstance().isLoaded()) {
                    this._tableManager = TableDataManager.getInstance();
                    return new Promise((resolve) => resolve());
                } else {
                    this._tableManager = new TableDataManager();
                    return this._tableManager.loadTableDatas();
                }
            }
            return new Promise(() => { });
        };

        this._cmdQueue.addCommand_async(api, { commandName: "initialize" });
    }

    public finalize() {
        const api: () => void = () => {

            this._unregisterPointerHanders();

            if (this._cmdUpdateObserver) {
                this._scene?.onBeforeRenderObservable.remove(this._cmdUpdateObserver);
            }
        };

        this._cmdQueue.addCommand(api, { commandName: "finalize" });
    }

    public createScreenShot(size: number, successCallback: (data: string) => void) {
        const api: () => void = () => {
            //https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG#createscreenshot
            if (this._context && this._context.getScene()) {
                BABYLON.Tools.CreateScreenshot(this._context.getScene()!.getEngine(), this._context.getCamera()!.getBabylonCamera()!, size, successCallback);
            }
            else {
                console.error("MyRoomAPI.createScreenShot() : no scene");
            }
        };

        this._cmdQueue.addCommand(api, { commandName: "createScreenShot", param: { size } });
    }

    //-----------------------------------------------------------------------------------
    // MyRoom 관련
    //-----------------------------------------------------------------------------------
    public initializeMyRoom(roomManifest: IAssetManifest_MyRoom | null, forRoomCoordi: boolean, onComplete: ((() => void) | null) = null, serviceType?: string) {
        this._cmdQueue.addCommand_async(
            () => { return this._initializeMyRoom(roomManifest, forRoomCoordi, onComplete, serviceType); },
            { commandName: "initializeMyRoom", param: { roomManifest, forRoomCoordi } }
        );
    }

    public clearMyRoom() {
        this._cmdQueue.addCommand(
            () => { return this._clearMyRoom(); },
            { commandName: "clearMyRoom" }
        );
    }

    public changeRoomSkin(roomManifest: IAssetManifest_MyRoom, onComplete: (((success: boolean) => void) | null) = null) {
        this._cmdQueue.addCommand_async(
            () => { return this._changeRoomSkin(roomManifest, onComplete); },
            { commandName: "changeRoomSkin", param: { roomManifest } }
        );
    }

    public getMyRoomMode(callback: (mode: EMyRoomMode) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getMyRoomMode()); },
            { commandName: "getMyRoomMode" }
        );
    }

    public getMyRoomController(callback: (controller: MyRoomController | null) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getMyRoomController()); },
            { commandName: "getMyRoomController" }
        );
    }

    public startMyRoomPlacementMode() {
        this._cmdQueue.addCommand(
            () => { this._startMyRoomPlacementMode(); },
            { commandName: "startMyRoomPlacementMode" }
        );
    }

    public endMyRoomPlacementMode() {
        this._cmdQueue.addCommand(
            () => { this._endMyRoomPlacementMode(); },
            { commandName: "endMyRoomPlacementMode" }
        );
    }

    public getAllFigureIds(callback: (ids: string[]) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getAllFigureIds()); },
            { commandName: "getAllFigureIds" }
        );
    }

    public getAllItemIds(callback: (ids: string[]) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getAllItemIds()); },
            { commandName: "getAllItemIds" }
        );
    }

    public getAllItemInstanceIds(callback: (ids: string[]) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getAllItemInstanceIds()); },
            { commandName: "getAllItemInstanceIds" }
        );
    }

    public setBackgroundColor(hexColor: string) {
        this._cmdQueue.addCommand(
            () => { this._setBackgroundColor(hexColor); },
            { commandName: "setBackgroundColor", param: { hexColor } }
        );
    }

    public changeEnvironment(environmentId: string, callback: () => void) {
        this._cmdQueue.addCommand(
            () => { this._changeEnvironment(environmentId, callback); },
            { commandName: "changeEnvironment", param: { environmentId } }
        );
    }

    public placeNewItem({ itemId, itemInstanceId, callback }: { itemId: string, itemInstanceId?:string, callback: (id: string) => void; }) {
        this._cmdQueue.addCommand_async(
            () => { return this._placeNewItem({ itemId, itemInstanceId, callback }); },
            { commandName: "placeNewItem", param: { itemId, itemInstanceId } }
        );
    }

    public removeItem(itemInstanceId: string) {
        this._cmdQueue.addCommand_async(
            () => { return this._removeItem(itemInstanceId); },
            { commandName: "removeItem", param: { itemInstanceId } }
        );
    }

    public removeItemsByItemId({ itemId, callback }: { itemId: string, callback: () => void; }) {
        this._cmdQueue.addCommand_async(
            () => { return this._removeItemsByItemId({ itemId, callback }); },
            { commandName: "removeItemsByItemId", param: { itemId } }
        );
    }

    public placeNewFigure(figureId: string, isAvatar: boolean, callback?:(success:boolean)=>void) {
        this._cmdQueue.addCommand_async(
            () => { return this._placeNewFigure(figureId, isAvatar).then((avatarId:string) => {callback?.(avatarId !== "");}); },
            { commandName: "placeNewFigure", param: { figureId, isAvatar } }
        );
    }

    public removeFigure(figureId: string) {
        this._cmdQueue.addCommand_async(
            () => { return this._removeFigure(figureId); },
            { commandName: "removeFigure", param: { figureId } }
        );
    }

    public rotateSelectedItemOrFigure() {
        this._cmdQueue.addCommand(
            () => { this._rotateSelectedItemOrFigure(); },
            { commandName: "rotateSelectedItemOrFigure" }
        );
    }

    public addCallbackRoomPlacementSelectionChanged(callback: (info: SelectionInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.addCallbackSelectionChanged(callback);
            return;
        }

        console.error("MyRoomAPI.addCallbackRoomPlacementSelectionChanged() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public removeCallbackPlacementSelectionChanged(callback: (info: SelectionInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.removeCallbackSelectionChanged(callback);
            return;
        }

        console.error("MyRoomAPI.removeCallbackPlacementSelectionChanged() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public addCallbackRoomPlacementDragEvent(callback: (info: DragInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.addCallbackDragChanged(callback);
            return;
        }

        console.error("MyRoomAPI.addCallbackRoomPlacementDragEvent() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public removeCallbackRoomPlacementDragEvent(callback: (info: DragInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.removeCallbackDragChanged(callback);
            return;
        }

        console.error("MyRoomAPI.removeCallbackRoomPlacementDragEvent() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public addCallbackRoomPlacementRemoveEvent(callback: (info: RemoveInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.addCallbackRemoveChanged(callback);
            return;
        }

        console.error("MyRoomAPI.addCallbackRoomPlacementRemoveEvent() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public removeCallbackRoomPlacementRemoveEvent(callback: (info: RemoveInfo) => void) {
        if (this._myRoomController) {
            this._myRoomController.removeCallbackRemoveChanged(callback);
            return;
        }

        console.error("MyRoomAPI.removeCallbackRoomPlacementRemoveEvent() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public deselectTarget() {
        this._cmdQueue.addCommand(
            () => { this._deselectTarget(); },
            { commandName: "deselectTarget" }
        );
    }

    public registerRoomObjectCountChangedEventHander(handler: (allPlacedItem: string[], allPlacedFigrues: string[]) => void) {
        if (this._myRoomController) {
            return this._myRoomController.registerRoomObjectCountChangedEventHandler(handler);
        }

        console.error("MyRoomAPI.registerCallbackRoomPlacementChanged() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    public makeMyRoomManifest(callback: (manifest: (IAssetManifest_MyRoom | undefined)) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._makeMyRoomManifest()); },
            { commandName: "makeMyRoomManifest" }
        );
    }

    public doItemFunction_MyRoom(instanceId: string, data: IMyRoomItemFunctionData | null) {
        this._cmdQueue.addCommand(
            () => { this._doItemFunction_MyRoom(instanceId, data); },
            { commandName: "doItemFunction_MyRoom", param: { instanceId, data } }
        );
    }

    public findItemController(itemInstanceId: string, callback: (controller: (ItemController | undefined)) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._findItemController(itemInstanceId)); },
            { commandName: "findItemController", param: { itemInstanceId } }
        );
    }

    public findItemControllersByItemId(itemId: string, callback: (controllers: ItemController[]) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._findItemControllersByItemId(itemId)); },
            { commandName: "findItemControllersByItemId", param: { itemId } }
        );
    }

    public findAvatarController(avatarId: string, callback: (contrller: (AvatarController | undefined)) => void, isOutside:boolean = false) {
        this._cmdQueue.addCommand(
            () => { callback(this._findAvatarController(avatarId, isOutside)); },
            { commandName: "findAvatarController", param: { avatarId } }
        );
    }

    public addCallbackCanvasPositionEventHandler_Item(itemInstanceId: string, handler: (canvasPos: BABYLON.Vector3) => void) {
        if (this._myRoomController) {
            const controller = this._myRoomController.findItemController(itemInstanceId);
            if (controller) {
                return controller.addCanvasPositionEventHandler_Top(handler);
            }
        } else if (this._itemController) {
            return this._itemController.addCanvasPositionEventHandler_Top(handler);
        }
    }

    public clearCallbackCanvasPostionEventHander_Item(itemInstanceId: string) {
        if (this._myRoomController) {
            const controller = this._myRoomController.findItemController(itemInstanceId);
            if (controller) {
                return controller.clearCanvasPositionEventHandler_Top();
            }
        } else if (this._itemController) {
            return this._itemController.clearCanvasPositionEventHandler_Top();
        }
    }

    public addCallbackCanvasPositionEventHandler_Figure_Top(figureId: string, handler: (canvasPos: BABYLON.Vector3) => void) {
        //console.log('initializeMyRoom 2');
        if (this._myRoomController) {
            //console.log('initializeMyRoom 3');
            const controller = this._myRoomController.findAvatarController(figureId, true);
            //console.log('initializeMyRoom 4');
            if (controller) {
                //console.log('initializeMyRoom 5');
                return controller.addCanvasPositionEventHandler_Top(handler);
            }
        } else if (this._avatarController) {
            return this._avatarController.addCanvasPositionEventHandler_Top(handler);
        }
    }

    public clearCallbackCanvasPostionEventHander_Figure_Top(figureId: string) {
        if (this._myRoomController) {
            const controller = this._myRoomController.findAvatarController(figureId, true);
            if (controller) {
                return controller.clearCanvasPositionEventHandler_Top();
            }
        } else if (this._avatarController) {
            return this._avatarController.clearCanvasPositionEventHandler_Top();
        }
    }

    public addCallbackCanvasPositionEventHandler_Figure_Bottom(figureId: string, handler: (canvasPos: BABYLON.Vector3) => void) {
        //console.log('initializeMyRoom 2');
        if (this._myRoomController) {
            //console.log('initializeMyRoom 3');
            const controller = this._myRoomController.findAvatarController(figureId, true);
            //console.log('initializeMyRoom 4');
            if (controller) {
                //console.log('initializeMyRoom 5');
                return controller.addCanvasPositionEventHandler_Bottom(handler);
            }
        } else if (this._avatarController) {
            return this._avatarController.addCanvasPositionEventHandler_Bottom(handler);
        }
    }

    public clearCallbackCanvasPostionEventHander_Figure_Bottom(figureId: string) {
        if (this._myRoomController) {
            const controller = this._myRoomController.findAvatarController(figureId, true);
            if (controller) {
                return controller.clearCanvasPositionEventHandler_Bottom();
            }
        } else if (this._avatarController) {
            return this._avatarController.clearCanvasPositionEventHandler_Bottom();
        }
    }

    // renderPeriod = 2이면, 2 frame마다 1번만 render
    // renderPeriod = 3이면, 3 frame마다 1번만 render
    // 즉, renderPeriod 클수록 render fps를 낮춤.
    public changeRenderLoop(renderPeriod: number) {
        if (this._scene && renderPeriod > 0 && this._renderPeriod !== renderPeriod) {
            this._renderPeriod = renderPeriod;
            ConstantsEx.changeRenderLoop(this._scene, renderPeriod);
        }
    }

    public addCameraDistanceChangeEventHandler(handler: (camDistRatio: number) => void) {
        if (this._context?.getCamera()) {
            this._context.getCamera()?.addCameraDistanceChangeEventHandler(handler);
        }
    }

    public clearDistanceChangeEventHandler() {
        if (this._context?.getCamera()) {
            this._context.getCamera()?.clearCameraDistanceChangeEventHandler();
        }
    }

    public setCameraDist(camDistRatio: number) {
        if (this._context?.getCamera()) {
            this._context.getCamera()?.setCameraDist(camDistRatio);
        }
    }

    public createOutsideFigures(figures: IOutsideFigureInfo[], onComplete: ((() => void) | null) = null) {
        this._cmdQueue.addCommand_async(
            () => { return this._createOutsideFigures(figures, onComplete); },
            { commandName: "createOutsideFigures", param: { figures } }
        );
    }

    public refreshFigureModels(avatarIds: string[]) {
        this._cmdQueue.addCommand(
            () => { this._refreshFigureModels(avatarIds); },
            { commandName: "refreshFigureModels", param: { avatarIds } }
        );
    }

    public startRoom() {
        this._cmdQueue.addCommand(
            () => { this._startRoom(); },
            { commandName: "startRoom", param: {} }
        );
    }

    //-----------------------------------------------------------------------------------
    // Avatar 관련
    //-----------------------------------------------------------------------------------
    public initializeAvatar(avatarId: string, manifest: IAssetManifest_Avatar, onComplete: ((() => void) | null) = null) {
        this._cmdQueue.addCommand_async(
            () => { return this._initializeAvatar(avatarId, manifest, onComplete); },
            { commandName: "initializeAvatar", param: { avatarId, manifest } }
        );
    }

    public clearAvatar() {
        this._cmdQueue.addCommand(
            () => { this._clearAvatar(); },
            { commandName: "clearAvatar" }
        );
    }

    public setDefaultAvatarCamera() {
        this._cmdQueue.addCommand(
            () => { this._setDefaultAvatarCamera(); },
            { commandName: "setDefaultAvatarCamera" }
        );
    }

    public setCameraMode(mode: ECameraMode) {
        this._cmdQueue.addCommand(
            () => { this._setCameraMode(mode); },
            { commandName: "setCameraMode" }
        );
    }

    public equipAvatarItem(itemId: string, onEquipResult: (oldItemId: string | undefined) => void) {
        this._cmdQueue.addCommand(
            () => { this._equipAvatarItem(itemId, onEquipResult); },
            { commandName: "equipAvatarItem", param: { itemId } }
        );
    }

    public unequipAvatarItem(itemId: string, exchange = false, isWebCall = false) {
        this._cmdQueue.addCommand(
            () => { this._unequipAvatarItem(itemId, exchange, isWebCall); },
            { commandName: "unequipAvatarItem", param: { itemId, exchange, isWebCall } }
        );
    }

    public unequipAllAvatarItem() {
        this._cmdQueue.addCommand(
            () => { this._unequipAllAvatarItem(); },
            { commandName: "unequipAllAvatarItem" }
        );
    }

    public getAllAvatarEquipItems(callback: (equipItems: string[]) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getAllAvatarEquipItems()); },
            { commandName: "getAllAvatarEquipItems" }
        );
    }

    public async playAnimation(itemId: string, playAniTag: string = "") {
        this._cmdQueue.addCommand_async(
            () => { return this._playAnimation(itemId, playAniTag); },
            { commandName: "playAnimation", param: { itemId, playAniTag } }
        );
    }

    public makeAvatarManifest(callback: (manifest: (IAssetManifest_Avatar | null)) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._makeAvatarManifest()); },
            { commandName: "makeAvatarManifest" }
        );
    }

    public setSkinColor(color: string) {
        this._cmdQueue.addCommand(
            () => { this._setSkinColor(color); },
            { commandName: "setSkinColor" }
        );
    }

    public setHairColor(color: string) {
        this._cmdQueue.addCommand(
            () => { this._setHairColor(color); },
            { commandName: "setHairColor" }
        );
    }

    public getFaceMorphValues(names: Array<string>): Array<number> {
        if (this._avatarController) {
            return this._avatarController.getAvatarFacialExpression().getFaceMorphValues(names);
        }
        return [];
    }

    public setFaceMorphValues(data: Array<ISetFaceMorphData>) {
        this._cmdQueue.addCommand(
            () => { this._setFaceMorphValues(data); },
            { commandName: "setFaceMorphValues", param: { data } }
        );
    }

    public applyHeadRotation(head: number, pitch: number, yaw: number) {
        this._cmdQueue.addCommand(
            () => { this._applyHeadRotation(head, pitch, yaw); },
            { commandName: "applyHeadRotation", param: { head, pitch, yaw } }
        );
    }

    public setUpdateRoutine(routine: () => void, set: boolean) {
        if (set) this._scene?.registerBeforeRender(routine);
        else this._scene?.unregisterBeforeRender(routine);
    }

    public setIdleUpdateRoutine(routine: () => void, set: boolean) {
        ConstantsEx.setIdleUpdateRoutine(this._scene, routine, set);
    }

    public enableFaceTracking(onComplete?: () => void) {
        this._cmdQueue.addCommand(
            () => { this._enableFaceTracking(onComplete); },
            { commandName: "enableFaceTracking" }
        );
    }

    //-----------------------------------------------------------------------------------
    // Item 관련
    //-----------------------------------------------------------------------------------
    public async initializeItem(itemId: string, onComplete: ((() => void) | null) = null, onTouch?: ((itemId: string) => void)) {
        this._cmdQueue.addCommand_async(
            () => { return this._initializeItem(itemId, onComplete, onTouch); },
            { commandName: "initializeItem", param: { itemId } }
        );
    }

    public getItemController(callback: (controller: (ItemController | null)) => void) {
        this._cmdQueue.addCommand(
            () => { callback(this._getItemController()); },
            { commandName: "getItemController" }
        );
    }

    public clearItem() {
        this._cmdQueue.addCommand(
            () => { this._clearItem(); },
            { commandName: "clearItem" }
        );
    }

    public doItemFunction(data: IMyRoomItemFunctionData | null) {
        this._cmdQueue.addCommand(
            () => { this._doItemFunction(data); },
            { commandName: "doItemFunction", param: { data } }
        );
    }

    public getItemTableData(itemId: string): BABYLON.Nullable<ItemData> {
        return TableDataManager.getInstance().findItem(itemId);
    }




    //-----------------------------------------------------------------------------------
    // Private Helpers (MyRoom 관련)
    //-----------------------------------------------------------------------------------
    private async _initializeMyRoom(roomManifest: IAssetManifest_MyRoom | null, forRoomCoordi: boolean, onComplete: (() => void) | null, serviceType?: string) {
        const start = performance.now();
        console.warn("🚀 [MyRoom] Bắt đầu khởi tạo phòng...");
    
        this._myRoomController = new MyRoomController(this._scene, this._assetLoader!, this._context!, serviceType);
        
        if (roomManifest) {
            console.log("📦 [MyRoom] Dữ liệu manifest đã nhận:", roomManifest);
    
            this._blockChangeRenderLoopByPointer = true;
            this.changeRenderLoop(RENDER_PERIOD_ACTIVE);
            console.log("🔄 [MyRoom] Bật chế độ render nhanh để khởi tạo...");
    
            console.log("🎨 [MyRoom] Khởi tạo backgroundColor:", roomManifest.main.room.backgroundColor);
            console.log("🧱 [MyRoom] RoomSkinId:", roomManifest.main.room.roomSkinId);
            console.log("📐 [MyRoom] Grids:", roomManifest.main.room.grids);
            console.log("🌳 [MyRoom] Environment:", roomManifest.main.environment);
    
            await this._myRoomController.initModel(
                roomManifest.main.room.backgroundColor,
                roomManifest.main.room.roomSkinId,
                roomManifest.main.room.grids,
                roomManifest.main.environment || "",
                Constants.PLAY_LOADING_ANIMATION_ROOM
            );
    
            if (roomManifest.main.items) {
                console.log("🪑 [MyRoom] Có", roomManifest.main.items.length, "item(s) cần đặt trong phòng");
    
                let datas;
                if (roomManifest.main.itemFunctionDatas && !forRoomCoordi) {
                    datas = roomManifest.main.itemFunctionDatas;
                    console.log("📎 [MyRoom] Kèm theo function data:", datas);
                }
    
                await this._myRoomController.placeItems(roomManifest.main.items, datas, Constants.PLAY_LOADING_ANIMATION_ITEM);
                console.log("✅ [MyRoom] Đã hoàn tất đặt item");
            }
    
            const middle = performance.now();
            console.warn(`⏱️ [MyRoom] Thời gian load phòng + item: ${(middle - start).toFixed(2)} ms.`);
    
            if (roomManifest.main.figures) {
                console.log("👤 [MyRoom] Có", roomManifest.main.figures.length, "figure(s) cần đặt");
                await this._myRoomController.placeFigures(
                    roomManifest.main.figures,
                    forRoomCoordi,
                    Constants.PLAY_LOADING_ANIMATION_FIGURE
                );
                console.log("✅ [MyRoom] Đã hoàn tất đặt figure");
            }
    
            this._blockChangeRenderLoopByPointer = false;
            this.changeRenderLoop(RENDER_PERIOD_NORMAL);
            console.log("🔁 [MyRoom] Trả render loop về chế độ bình thường");
        } else {
            console.warn("⚠️ [MyRoom] Không có roomManifest để khởi tạo");
        }
    
        onComplete?.();
        const end = performance.now();
        console.warn(`⏱️ [MyRoom] Tổng thời gian khởi tạo phòng: ${(end - start).toFixed(2)} ms.`);
    }
    

    private async _changeRoomSkin(roomManifest: IAssetManifest_MyRoom | null, onComplete: ((success: boolean) => void) | null) {
        if (!this._myRoomController) {
            console.error("MyRoomAPI._changeRoomSkin() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
            onComplete?.(false);
            return;
        }

        if (roomManifest) {

            const curRoomManifest = this._myRoomController.makeMyRoomManifest();
            this._myRoomController.beforeChangeRoomSkin(curRoomManifest.main.items, curRoomManifest.main.figures);

            await this._myRoomController.initModel(roomManifest.main.room.backgroundColor, roomManifest.main.room.roomSkinId, roomManifest.main.room.grids, roomManifest.main.environment || "");

            await this._myRoomController.afterChangeRoomSkin();
        }

        onComplete?.(true);
    }

    private _clearMyRoom() {
        if (this._myRoomController) {
            this._myRoomController.dispose();
            this._myRoomController = null;
        }

        this._scene?.meshes.forEach((m) => {
            m.dispose();
        });
    }

    private _getMyRoomMode(): EMyRoomMode {
        if (this._myRoomController) {
            return this._myRoomController.getCurrentMode();
        }

        console.error("MyRoomAPI.startMyRoomPlacementMode() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        return EMyRoomMode.None;
    }

    private _getMyRoomController(): MyRoomController | null {
        return this._myRoomController;
    }

    private _startMyRoomPlacementMode() {
        console.log('startMyRoomPlacementMode');
        if (this._myRoomController) {
            this._myRoomController.changeMode(EMyRoomMode.Placement);
        }
        else {
            console.error("MyRoomAPI.startMyRoomPlacementMode() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        }

    }

    private _endMyRoomPlacementMode() {
        console.log('endMyRoomPlacementMode');
        if (this._myRoomController) {
            this._myRoomController.changeMode(EMyRoomMode.View);
        }
        else {
            console.error("MyRoomAPI.endMyRoomPlacementMode() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        }
    }

    private _getAllFigureIds(): string[] {
        if (this._myRoomController) {
            return this._myRoomController.getRoomObjectCounter().getAllAvatarControllerAvatarIds();
        }

        return [];
    }

    private _getAllItemIds(): string[] {
        if (this._myRoomController) {
            return this._myRoomController.getRoomObjectCounter().getAllItemControllerItemIds();
        }

        return [];
    }

    private _getAllItemInstanceIds(): string[] {
        if (this._myRoomController) {
            return this._myRoomController.getRoomObjectCounter().getAllItemControllerItemInstanceIds();
        }

        return [];
    }

    private _setBackgroundColor(hexColor: string) {
        if (this._myRoomController) {
            this._myRoomController.setBackgroundColor(hexColor);
        }
        else {
            console.error("MyRoomAPI.setBackgroundColor() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        }
    }

    private async _changeEnvironment(environmentId: string, callback: () => void) {
        if (this._myRoomController) {
            await this._myRoomController.changeEnvironment(environmentId);
        }
        else {
            console.error("MyRoomAPI.changeEnvironment() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        }
        callback();
    }

    private async _placeNewItem({ itemId, itemInstanceId, callback }: { itemId: string, itemInstanceId?: string, callback: (id: string) => void; }): Promise<string> {
        if (this._myRoomController) {
            const placedItemId = await this._myRoomController.placeNewItem(itemId, itemInstanceId);
            callback(placedItemId);
            return placedItemId;
        }
        console.error("MyRoomAPI.placeNewItem() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        callback('');
        return "";
    }

    private async _removeItem(itemInstanceId: string): Promise<void> {
        if (this._myRoomController) {
            return await this._myRoomController.removeItem(itemInstanceId);
        }
        console.error("MyRoomAPI.removeItem() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private async _removeItemsByItemId({ itemId, callback }: { itemId: string, callback: () => void; }): Promise<void> {
        if (this._myRoomController) {
            await this._myRoomController.removeItemsByItemId(itemId);
            callback();
            return;
        }
        console.error("MyRoomAPI.removeItemsByItemId() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private async _placeNewFigure(figureId: string, isAvatar: boolean): Promise<string> {
        if (this._myRoomController) {
            return await this._myRoomController.placeNewFigure(figureId, isAvatar);
        }
        console.error("MyRoomAPI.placeNewFigure() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        return "";
    }

    private async _removeFigure(figureId: string): Promise<void> {
        if (this._myRoomController) {
            return await this._myRoomController.removeFigure(figureId);
        }
        console.error("MyRoomAPI.removeFigure() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _rotateSelectedItemOrFigure() {
        if (this._myRoomController) {
            this._myRoomController.rotateSelectedItemOrFigure();
            return;
        }

        console.error("MyRoomAPI.rotateSelectedItemOrFigure() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _deselectTarget() {
        if (this._myRoomController) {
            this._myRoomController.deselectTarget();
            return;
        }

        console.error("MyRoomAPI.deselectTarget() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _makeMyRoomManifest(): IAssetManifest_MyRoom | undefined {
        if (this._myRoomController) {
            return this._myRoomController.makeMyRoomManifest();
        }

        console.error("MyRoomAPI.getMyRoomManifest() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        return undefined;
    }

    private _doItemFunction_MyRoom(instanceId: string, data: IMyRoomItemFunctionData | null) {
        if (this._myRoomController) {
            this._myRoomController.doItemFunction(instanceId, data);
            return;
        }

        console.error("MyRoomAPI.doItemFunction_MyRoom() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _findItemController(itemInstanceId: string): ItemController | undefined {
        if (this._myRoomController) {
            return this._myRoomController.findItemController(itemInstanceId);
        }

        console.error("MyRoomAPI.findItemController() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _findItemControllersByItemId(itemId: string): ItemController[] {
        if (this._myRoomController) {
            return this._myRoomController.findAllItemControllerByItemId(itemId);
        }

        console.error("MyRoomAPI.findItemControllersByItemId() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
        return [];
    }

    private _findAvatarController(avatarId: string, isOutside:boolean): AvatarController | undefined {
        if (this._myRoomController) {
            return isOutside ? this._myRoomController.findOutsideAvatarController(avatarId) : this._myRoomController.findAvatarController(avatarId);
        }

        console.error("MyRoomAPI.findAvatarController() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private async _createOutsideFigures(figures: IOutsideFigureInfo[], onComplete: ((() => void) | null) = null): Promise<void> {
        if (this._myRoomController) {
            await this._myRoomController.createOutsideFigures(figures);
            onComplete?.();
            return;
        }

        console.error("MyRoomAPI.findAvatarController() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private async _refreshFigureModels(figureIds: string[]): Promise<void> {
        if (this._myRoomController) {
            await this._myRoomController.refreshFigureModels(figureIds);
            return;
        }

        console.error("MyRoomAPI.refreshFigureModels() : not initialized MyRoomController!!! initializeMyRoom() first!!!");
    }

    private _startRoom() {
        this._myRoomController?.startRoom();
    }

    //-----------------------------------------------------------------------------------
    // Private Helper (아바타)
    //-----------------------------------------------------------------------------------
    private async _initializeAvatar(avatarId: string, manifest: IAssetManifest_Avatar, onComplete: ((() => void) | null) = null) {
        if (this._avatarController) {
            this._avatarController.dispose();
            this._avatarController = null;
        }

        if (this._scene) {
            this._scene.clearColor = BABYLON.Color4.FromHexString("#00000000");
            this.getContext()!.getEnvController()!.showSkybox(false);
            //this.getContext()!.getEnvController()!.setDefaultPipeline();
        }
        this._avatarController = new AvatarController(avatarId, this._scene, this._assetLoader!, this._context!, null);
        await this._avatarController.loadModelFromManifest(manifest);

        const delay = (time: number) => {
            return new Promise(resolve => setTimeout(resolve, time));
        };

        await delay(100);

        this._setDefaultAvatarCamera();

        if (null !== onComplete) {
            onComplete();
        }
    }

    private _clearAvatar() {
        if (this._avatarController) {
            this._avatarController.dispose();
            this._avatarController = null;
        }
    }

    private _setDefaultAvatarCamera() {
        if (this._avatarController && this._context) {
            this._context.getCamera()!.changeCameraMode(ECameraMode.Avatar, this._avatarController);
        }
    }

    private _setCameraMode(mode: ECameraMode) {
        if (this._context) {
            switch (mode) {
                case ECameraMode.MyRoom:
                case ECameraMode.PlaceMode:
                case ECameraMode.Joysam:
                    this._context.getCamera()!.changeCameraMode(mode, this._myRoomController);
                    break;
                case ECameraMode.Item:
                    this._context.getCamera()!.changeCameraMode(mode, this._itemController);
                    break;
                case ECameraMode.Avatar:
                case ECameraMode.AvatarCustomizingMode:
                case ECameraMode.EditStatusMessage:
                case ECameraMode.KHConv:
                    this._context.getCamera()!.changeCameraMode(mode, this._avatarController);
                    break;
                default:
                    console.error(`MyRoomAPI.setCameraMode() : invalid mode(${mode})`);
                    break;
            }
        }
    }

    private _equipAvatarItem(itemId: string, onResult: (oldItemId: string | undefined) => void) {
        if (this._avatarController) {
            this._avatarController.getAvatarEquipment().equipItem(itemId).then((oldItem) => { onResult(oldItem); });
        }
    }

    private _unequipAvatarItem(itemId: string, exchange = false, isWebCall = false) {
        if (this._avatarController) {
            this._avatarController.getAvatarEquipment().unequipItem(itemId, exchange, isWebCall);
        }
    }

    private _unequipAllAvatarItem() {
        if (this._avatarController) {
            this._avatarController.getAvatarEquipment().unEquipAllItems();
        }
    }

    private _getAllAvatarEquipItems(): string[] {
        if (this._avatarController) {
            return this._avatarController.getAvatarEquipment().getAllEquipItems();
        }
        return [];
    }

    private async _playAnimation(itemId: string, playAniTag: string = "") {
        if (this._avatarController) {
            return this._avatarController.getAvatarAnimation().LoadAndPlayAnimation(itemId, true, playAniTag);
        }
    }

    private _makeAvatarManifest(): IAssetManifest_Avatar | null {
        if (this._avatarController) {
            return this._avatarController.makeAvatarManifest();
        }

        return null;
    }

    private _setSkinColor(color: string) {
        if (this._avatarController) {
            this._avatarController.getAvatarCustomization().setSkinColor(color);
        }
    }

    private _setHairColor(color: string) {
        if (this._avatarController) {
            this._avatarController.getAvatarCustomization().setHairColor(color);
        }
    }

    private _setFaceMorphValues(data: Array<ISetFaceMorphData>) {
        if (this._avatarController) {
            this._avatarController.getAvatarFacialExpression().setFaceMorphValues(data);
        }
    }

    private _applyHeadRotation(head: number, pitch: number, yaw: number) {
        if (this._avatarController) {
            this._avatarController.applyHeadRotation(head, pitch, yaw);
        }
    }

    private _enableFaceTracking(onComplete?: () => void) {
        if (this._avatarController) {
            this._avatarController.getAvatarFacialExpression()?.enableFacialExpression().then(onComplete);
        }
    }

    //-----------------------------------------------------------------------------------
    // Private Helper (아이템)
    //-----------------------------------------------------------------------------------
    private async _initializeItem(itemId: string, onComplete: ((() => void) | null) = null, onTouch?: (itemId: string) => void) {
        if (this._itemController) {
            this._itemController.dispose();
            this._itemController = null;
        }

        if (this._scene) {
            this._scene.clearColor = BABYLON.Color4.FromHexString("#00000000");
            this.getContext()!.getEnvController()!.showSkybox(false);
            //this.getContext()!.getEnvController()!.setDefaultPipeline();
        }

        this._itemController = new ItemController(itemId, itemId, this._scene, this._assetLoader!, this._context!, null, true, onTouch);
        await this._itemController.initModel();

        const delay = (time: number) => {
            return new Promise(resolve => setTimeout(resolve, time));
        };

        await delay(100);

        if (this._context) {
            this._context.getCamera()!.changeCameraMode(ECameraMode.Item, this._itemController);
        }

        if (null !== onComplete) {
            onComplete();
        }
    }

    private _getItemController(): ItemController | null {
        return this._itemController;
    }

    private _clearItem() {
        if (this._itemController) {
            this._itemController.dispose();
            this._itemController = null;
        }
    }

    private _doItemFunction(data: IMyRoomItemFunctionData | null) {
        if (this._itemController) {
            this._itemController.doItemFunction(data);
        }
    }

    //-----------------------------------------------------------------------------------
    // Pointer 이벤트 처리
    //-----------------------------------------------------------------------------------
    private _registerPointerHandlers() {
        if (this._pointerObserver || !this._scene) {
            return;
        }
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (this._blockChangeRenderLoopByPointer) return;

            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    // touch중에는 30fps로
                    this.changeRenderLoop(RENDER_PERIOD_ACTIVE);
                    // 최적화를 위해서 glow mesh만 render하도록
                    // click할때는 깜박이는 것을 피하기 위해서 타이머 처리
                    this._clearOptimizeGlowTimer();
                    this._optimzeGlowTimerId = window.setTimeout(() => {
                        this._context?.getEnvController()?.applyOnlyIncludeGlowMeshes(true);
                    }, 300);
                    //this._context?.getEnvController()?.changeAntialiasingSamples(2);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    // touch가 아닐때는 20fps로
                    this.changeRenderLoop(RENDER_PERIOD_NORMAL);
                    this._clearOptimizeGlowTimer();
                    this._context?.getEnvController()?.applyOnlyIncludeGlowMeshes(false);
                    //this._context?.getEnvController()?.changeAntialiasingSamples(4);
                    break;
            }
        });
    }

    private _unregisterPointerHanders() {
        if (this._scene && this._pointerObserver) {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = null;
        }

        this._clearOptimizeGlowTimer();
    }

    private _clearOptimizeGlowTimer() {
        if (this._optimzeGlowTimerId) {
            window.clearTimeout(this._optimzeGlowTimerId);
            this._optimzeGlowTimerId = null;
        }
    }
}