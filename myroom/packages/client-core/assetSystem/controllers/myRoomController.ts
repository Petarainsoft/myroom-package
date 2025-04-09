import * as BABYLON from "@babylonjs/core";
import { IAssetLoader, eAssetType } from "../definitions";
import { MyRoomContext } from "../myRoomContext";
import { ItemPlacementManager } from "./roomSubSystem/ItemPlacementManager";
import { OutsidePlacementManager } from "./roomSubSystem/OutsidePlacementManager";
import { IAssetManifest_MyRoom, IMyRoomFigurePlacementInfo, IMyRoomItemFunctionData, IMyRoomItemPlacementInfo, IRoomGridInfo, IOutsideFigureInfo } from "../jsonTypes/manifest/assetManifest_MyRoom";

import { InputHandler_PlaceMode, SelectionInfo, DragInfo } from "./roomSubSystem/InputHandler_PlaceMode";
import { InputHandler_ViewMode } from "./roomSubSystem/InputHandler_ViewMode";
import { IRoomMeshInfo } from "./roomSubSystem/GridManager";
import { Constants } from "../constants";
import { ConstantsEx } from "../constantsEx";

import { TableDataManager } from "../../tableData/tableDataManager";
import { RoomObjectCounter } from "./roomSubSystem/roomObjectCounter";
import { ItemController } from "./itemController";
import { AvatarController } from "./avatarController";
import { IAssetManifest_Environment } from "../jsonTypes/manifest/assetManifest_Environment";
import { ECameraMode } from "./cameraController";
import { IMyRoomCommandRecordingData } from "../../myRoomCommandRecorder";
import { MultiTouchChecker } from "./roomSubSystem/multiTouchChecker";
import { RemoveInfo } from "./roomSubSystem/ItemPlacementManager";

export enum EMyRoomMode {
    None,
    View,
    Placement,
}

export class MyRoomController extends BABYLON.TransformNode {
    private _assetLoader: IAssetLoader;
    private _context: MyRoomContext;
    private _itemPlacementManager: ItemPlacementManager;
    private _outsidePlacementManager: OutsidePlacementManager;
    private _inputHandler_PlaceMode: InputHandler_PlaceMode;
    private _inputHandler_ViewMode: InputHandler_ViewMode;
    private _roomSkinId: string = "";
    private _roomGridInfos: IRoomGridInfo[] = [];
    private _backgroundColor: string = "#6b8cc2ff";
    private _environmentItemId: string = "";
    private _testItemIds: string[] = [];
    private _currentMode: EMyRoomMode = EMyRoomMode.View;
    private _roomObjectCounter: RoomObjectCounter;
    private _multiTouchChecker: MultiTouchChecker;
    private _showGrid: boolean = false;
    private _keyHandler: BABYLON.Nullable<BABYLON.Observer<BABYLON.KeyboardInfo>> = null;
    private _modelRoot: BABYLON.Nullable<BABYLON.TransformNode> = null;
    private _serviceType: string | undefined;

    private _roomObjectCountChangedEvnetHandler: ((itemIds: string[], avatarIds: string[]) => void) | null = null;

    public getRoomContext(): MyRoomContext {
        return this._context;
    }

    public getItemPlacementManager(): ItemPlacementManager {
        return this._itemPlacementManager;
    }

    public getOutsidePlacementManager(): OutsidePlacementManager {
        return this._outsidePlacementManager;
    }

    public getInputHandler_PlaceMode(): InputHandler_PlaceMode {
        return this._inputHandler_PlaceMode;
    }

    public getInputHandler_ViewMode(): InputHandler_ViewMode {
        return this._inputHandler_ViewMode;
    }

    public getBackgroundColor(): string {
        return this._backgroundColor;
    }

    public getCurrentMode(): EMyRoomMode {
        return this._currentMode;
    }

    public getRoomObjectCounter(): RoomObjectCounter {
        return this._roomObjectCounter;
    }

    public getServiceType(): string | undefined {
        return this._serviceType;
    }

    public constructor(scene: BABYLON.Nullable<BABYLON.Scene>, assetLoader: IAssetLoader, roomContext: MyRoomContext, serviceType?: string) {
        super("[MyRoom]", scene);

        this._serviceType = serviceType;
        this._multiTouchChecker = new MultiTouchChecker(scene?.getEngine().getRenderingCanvas());

        this._context = roomContext;
        this._roomObjectCounter = new RoomObjectCounter(this);

        this.parent = null;
        this.position = new BABYLON.Vector3(-Constants.MYROOM_FLOOR_SIZE_METER * 0.5, 0, Constants.MYROOM_FLOOR_SIZE_METER * 0.5);
        this.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 0, 0);


        this._assetLoader = assetLoader;
        this._itemPlacementManager = new ItemPlacementManager(this, this._assetLoader);
        this._outsidePlacementManager = new OutsidePlacementManager(this, this._assetLoader);
        this._inputHandler_PlaceMode = new InputHandler_PlaceMode(this, this._scene);
        this._inputHandler_ViewMode = new InputHandler_ViewMode(this, this._scene);

        this.changeMode(EMyRoomMode.View);

        this._refreshCustomInspectorProperties();

        this.onDispose = () => { this.finalize(); };

    }

    public finalize() {
        this._inputHandler_PlaceMode.finalize();
        this._inputHandler_ViewMode.finalize();
        this._itemPlacementManager.finalize();
        this._outsidePlacementManager.finalize();

        if (this._keyHandler) {
            this._scene.onKeyboardObservable.remove(this._keyHandler);
            this._keyHandler = null;
        }
    }

    public beforeChangeRoomSkin(_placeInfos?: IMyRoomItemPlacementInfo[], _allFigurePlaceInfos?: IMyRoomFigurePlacementInfo[]) {
        this._inputHandler_PlaceMode.beforeChangeRoomSkin();
        this._inputHandler_ViewMode.beforeChangeRoomSkin();
        this._itemPlacementManager.beforeChangeRoomSkin(_placeInfos, _allFigurePlaceInfos);
        this._outsidePlacementManager.beforeChangeRoomSkin();

        if (this._keyHandler) {
            this._scene.onKeyboardObservable.remove(this._keyHandler);
            this._keyHandler = null;
        }

        this._modelRoot?.dispose();
        this._modelRoot = null;
    }

    public async afterChangeRoomSkin() {
        this._inputHandler_PlaceMode.afterChangeRoomSkin();
        this._inputHandler_ViewMode.afterChangeRoomSkin();
        await this._itemPlacementManager.afterChangeRoomSkin();
        this._outsidePlacementManager.afterChangeRoomSkin();
    }

    public async initModel(backgroundColor: string, roomSkinId: string, roomGridInfos: IRoomGridInfo[], environment: string, playAnimation?: boolean) {
        this._roomSkinId = roomSkinId;
        this._roomGridInfos = roomGridInfos;

        const floorGridSize = this._getFloorGridSize();
        if (floorGridSize.h > 0 && floorGridSize.w > 0) {
            this.position = new BABYLON.Vector3(-floorGridSize.w * Constants.MYROOM_GRID_UNIT_SIZE * 0.5, 0, floorGridSize.h * Constants.MYROOM_GRID_UNIT_SIZE * 0.5);
            this.computeWorldMatrix(true);

            this._context.getCamera()?.setCameraTargetPos(new BABYLON.Vector3(-floorGridSize.w * Constants.MYROOM_GRID_UNIT_SIZE * 0.5, 2.8, floorGridSize.h * Constants.MYROOM_GRID_UNIT_SIZE * 0.5));
            this._context.getCamera()?.changeCameraMode(this._currentMode === EMyRoomMode.Placement ? ECameraMode.PlaceMode : this._getCameraDefaultMode(), this);
        }
        this.setBackgroundColor(backgroundColor);

        this._environmentItemId = environment;
        if (environment && environment !== "ignore") {
            const env = await this._assetLoader.loadManifest<IAssetManifest_Environment>(eAssetType.Enviroment, environment, undefined);
            if (env) {
                this._context.getEnvController()!.applyEnvironmentSetting(env);
            }
        }

        this._context.getEnvController()!.showSkybox(false);
        this._keyHandler = this._scene.onKeyboardObservable.add(e => this._test(e));

        let root: BABYLON.TransformNode = new BABYLON.TransformNode(Constants.MYROOM_SKIN_MESH_ROOT, this._scene);
        root.parent = this;
        this._modelRoot = root;
        if (playAnimation) {
            root.position = new BABYLON.Vector3(0, 20, 0);
            root.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        }

        const loadingResult = await this._assetLoader.loadAssetIntoScene(eAssetType.Model_glb, this._roomSkinId, root);

        const allMeshes = new Map<string, BABYLON.AbstractMesh>();
        loadingResult.loadedObjects.meshes.forEach(mesh => {
            mesh.parent = root;
            mesh.getChildMeshes().forEach(childMesh => {
                allMeshes.set(childMesh.name, childMesh);
                this._context.getEnvController()!.getShadowGenerator()?.addShadowCaster(childMesh);
                childMesh.receiveShadows = true;
                childMesh.computeWorldMatrix(true);
            });
        });

        if (playAnimation) {
            root.position = new BABYLON.Vector3(0, 0, 0);

            const ease = new BABYLON.CubicEase();
            ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

            const animationWithPromise = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    BABYLON.Animation.CreateAndStartAnimation('anim', root, 'scaling', Constants.PLAY_LOADING_ANIMATION_SPEED, Constants.PLAY_LOADING_FRAME, root.scaling, new BABYLON.Vector3(1, 1, 1), 0, ease, resolve);
                });
            };
            await animationWithPromise();
        }


        const roomMeshInfos: IRoomMeshInfo[] = [];
        this._roomGridInfos.forEach(info => {
            if (allMeshes.has(info.meshName)) {
                roomMeshInfos.push({
                    mesh: allMeshes.get(info.meshName)!,
                    gridInfo: info
                });
            }
            else {
                console.warn(`MyRoomController.initModel() => not find room mesh ${info.meshName}`);
            }
        });

        this._inputHandler_PlaceMode.repositionPickingGuardWall();

        // mesh 생성시 computeWorldMatrix를 해서 안해도 됨. (by ulralra)
        // const delay = (time: number) => {
        //     return new Promise(resolve => setTimeout(resolve, time));
        // };

        //await delay(500);

        this._itemPlacementManager.initialize(roomMeshInfos);
        this._outsidePlacementManager.initialize();
    }

    public changeMode(mode: EMyRoomMode) {
        this._currentMode = mode;
        this._inputHandler_PlaceMode.enableHandler(this._currentMode === EMyRoomMode.Placement);
        this._inputHandler_ViewMode.enableHandler(this._currentMode === EMyRoomMode.View);
        this._context.getCamera()?.changeCameraMode(this._currentMode === EMyRoomMode.Placement ? ECameraMode.PlaceMode : this._getCameraDefaultMode(), this);
    }

    public async placeItems(items: IMyRoomItemPlacementInfo[], functionDatas?: IMyRoomItemFunctionData[], playAnimation?: boolean) {
        await this._itemPlacementManager.placeItems(items, functionDatas, playAnimation);
        if (playAnimation) await this._itemPlacementManager.playItemLoadingAnimation();
    }

    public async placeFigures(figures: IMyRoomFigurePlacementInfo[], forRoomCoordi: boolean, playAnimation?: boolean) {
        await this._itemPlacementManager.placeFigures(figures, forRoomCoordi, playAnimation);
        if (playAnimation) await this._itemPlacementManager.playFigureLoadingAnimation();
    }

    // public async playLoadingAnimation() {
    //     const processes = [];
    //     processes.push(this._itemPlacementManager.playItemLoadingAnimation());
    //     processes.push(this._itemPlacementManager.playFigureLoadingAnimation());
    //     await Promise.all(processes);
    // }

    public setBackgroundColor(hexColor: string) {
        this._backgroundColor = hexColor;
        if (this._scene) {
            this._scene.clearColor = BABYLON.Color4.FromHexString("#00000000");// ==> front에서 컬러 지정하기로 함
            //this._scene.clearColor = BABYLON.Color4.FromHexString(hexColor);
        }
    }

    public async changeEnvironment(environmentId: string) {
        this._environmentItemId = environmentId;
        if (environmentId && environmentId !== "ignore") {
            const env = await this._assetLoader.loadManifest<IAssetManifest_Environment>(eAssetType.Enviroment, environmentId, undefined);
            if (env) {
                this._context.getEnvController()!.applyEnvironmentSetting(env);
            }
        }

        this._context.getEnvController()!.showSkybox(false);
    }

    public async placeNewItem(itemId: string, itemInstanceId?: string): Promise<string> {
        const instanceId = await this._itemPlacementManager.placeNewItem(itemId, itemInstanceId);
        const itemController = this.findItemController(instanceId);
        if (itemController) {
            this._inputHandler_PlaceMode.selectTarget(itemController);
        }
        else {
            this.deselectTarget();
        }

        return instanceId;
    }

    public async removeItem(itemInstanceId: string): Promise<void> {
        this._itemPlacementManager.removeItem(itemInstanceId);
    }

    public async removeItemsByItemId(itemId: string): Promise<void> {
        const removeItems = this._itemPlacementManager.findAllItemsByItemId(itemId);
        removeItems.forEach((item) => {
            this.removeItem(item.getItemInstanceId());
        });
    }

    public async placeNewFigure(figureId: string, isAvatar: boolean): Promise<string> {
        const avatarId = await this._itemPlacementManager.placeNewFigure(figureId, isAvatar);
        const avatarController = this.findAvatarController(avatarId);
        if (avatarController) {
            this._inputHandler_PlaceMode.selectTarget(avatarController);
        }
        else {
            this.deselectTarget();
        }
        return avatarId;
    }

    public async removeFigure(figureId: string): Promise<void> {
        this._itemPlacementManager.removeFigure(figureId);
    }

    public rotateSelectedItemOrFigure() {
        this.getInputHandler_PlaceMode().rotateCurrentItem();
    }

    public makeMyRoomManifest(): IAssetManifest_MyRoom {
        const roomManifest = this._getDefaultRoomManifest();

        //Skin 설정
        roomManifest.main.room.roomSkinId = this._roomSkinId;
        //Background Color 설정
        roomManifest.main.room.backgroundColor = this._backgroundColor;
        //grid 정보 저장
        roomManifest.main.room.grids = this._roomGridInfos;
        //배치된 아이템 정보
        roomManifest.main.items = this._makeAllItemPlacementInfos();
        //배치된 Figure 정보
        roomManifest.main.figures = this._makeAllFigurePlacementInfos();
        //기능성 아이템 정보
        roomManifest.main.itemFunctionDatas = this._makeAllItemFunctionDatas();
        //환경 설정 id
        roomManifest.main.environment = this._environmentItemId;


        //테스트 아이템 정보
        roomManifest.testItems = this._testItemIds;
        return roomManifest;
    }

    public addCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this._inputHandler_PlaceMode.addCallbackSelectionChanged(callback);
        this._inputHandler_ViewMode.addCallbackSelectionChanged(callback);
    }

    public removeCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this._inputHandler_PlaceMode.removeCallbackSelectionChanged(callback);
        this._inputHandler_ViewMode.removeCallbackSelectionChanged(callback);
    }

    public addCallbackDragChanged(callback: (info: DragInfo) => void) {
        this._inputHandler_PlaceMode.addCallbackDragChanged(callback);
    }

    public removeCallbackDragChanged(callback: (info: DragInfo) => void) {
        this._inputHandler_PlaceMode.removeCallbackDragChanged(callback);
    }

    public addCallbackRemoveChanged(callback: (info: RemoveInfo) => void) {
        this._itemPlacementManager.addCallbackRemoveChanged(callback);
    }

    public removeCallbackRemoveChanged(callback: (info: RemoveInfo) => void) {
        this._itemPlacementManager.removeCallbackRemoveChanged(callback);
    }

    public deselectTarget() {
        this._inputHandler_PlaceMode.deselectTarget();
        this._inputHandler_ViewMode.deselectTarget();
    }

    public registerRoomObjectCountChangedEventHandler(handler: (itemIds: string[], avatarIds: string[]) => void) {
        this._roomObjectCountChangedEvnetHandler = handler;
    }

    public notifyRoomObjectCountChanged() {
        if (this._roomObjectCountChangedEvnetHandler) {
            this._roomObjectCountChangedEvnetHandler(this._roomObjectCounter.getAllItemControllerItemIds(), this._roomObjectCounter.getAllAvatarControllerAvatarIds());
        }
    }

    public doItemFunction(itemInstanceId: string, data: IMyRoomItemFunctionData | null) {
        const targetItem = this._itemPlacementManager.getPlacedItemController(itemInstanceId);
        if (targetItem) {
            targetItem.doItemFunction(data);
        }
        else {
            console.error("MyRoomController.doItemFunction() => no found item!");
        }
    }

    public findItemController(itemInstanceId: string): ItemController | undefined {
        return this._itemPlacementManager.getPlacedItemController(itemInstanceId);
    }

    public findAllItemControllerByItemId(itemId: string): ItemController[] {
        return this._itemPlacementManager.findAllItemsByItemId(itemId);
    }

    public findAvatarController(avatarId: string, includeOutside: boolean = false): AvatarController | undefined {
        const result = this._itemPlacementManager.getPlacedAvatarController(avatarId);
        if (!result && includeOutside) {
            return this._outsidePlacementManager.getPlacedAvatarController(avatarId);
        }
        return result;
    }

    public findOutsideAvatarController(avatarId: string): AvatarController | undefined {
        return this._outsidePlacementManager.getPlacedAvatarController(avatarId);
    }

    public handleRecordingData(data: IMyRoomCommandRecordingData) {
        this._inputHandler_PlaceMode.handleRecordingData(data);
    }

    public async createOutsideFigures(figures: IOutsideFigureInfo[]): Promise<void> {
        await this._outsidePlacementManager.placeFigures(figures);
    }

    public async refreshFigureModels(figureIds: string[]): Promise<void> {
        figureIds.forEach((id) => {
            this.findAvatarController(id)?.refreshModel();
        });
    }

    public startRoom() {
        this._itemPlacementManager.startRoom();
    }

    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------
    private _makeAllItemPlacementInfos(): IMyRoomItemPlacementInfo[] | undefined {
        const result: IMyRoomItemPlacementInfo[] = [];
        const notProcessedItems = this._itemPlacementManager.getAllPlacedItemList();
        const processedItemInstanceIds: string[] = [];

        //무한히 돌지말고 10번까지만 (parenting max 10)
        for (let count = 0; count < 10; count++) {
            const willRemoveInstanceIds: string[] = [];
            notProcessedItems.forEach((item) => {
                //부모가 없거나 , 부모가 processedItemInstanceIds에 존재할 경우
                if (!item.parent || processedItemInstanceIds.findIndex((id) => id === item.getParentItemController()?.getItemInstanceId()) >= 0) {

                    //placementinfo 만들고.. 추가하자..
                    const info = this._itemPlacementManager.getItemPlacementInfo(item.getItemInstanceId());
                    let pid = "";
                    if (info && this._itemPlacementManager.getItemPlacementInfo(info.gridName, true)) {
                        pid = info.gridName;
                    }

                    const placementInfo: IMyRoomItemPlacementInfo = {
                        itemId: item.getItemId(),
                        instanceId: item.getItemInstanceId(),
                        parentId: pid,
                        placeInfo: info!
                    };

                    result.push(placementInfo);

                    processedItemInstanceIds.push(item.getItemInstanceId());
                    willRemoveInstanceIds.push(item.getItemInstanceId());
                }
            });

            //처리한 아이템 제거
            willRemoveInstanceIds.forEach((deleteId) => {
                const idx = notProcessedItems.findIndex((c) => c.getItemInstanceId() === deleteId);
                if (idx >= 0) {
                    notProcessedItems.splice(idx, 1);
                }
            });
        }

        if (notProcessedItems.length > 0) {
            console.error("MyRoomController._makeAllItemPlacementInfos() ==> Check Logic!!!!!");
        }

        return result;
    }

    private _makeAllFigurePlacementInfos(): IMyRoomFigurePlacementInfo[] | undefined {
        const result: IMyRoomFigurePlacementInfo[] = [];
        const figureList = this._itemPlacementManager.getAllPlacedFigureList();

        figureList.forEach((figure) => {
            //placementinfo 만들고.. 추가하자..
            const info = this._itemPlacementManager.getFigurePlacementInfo(figure.getAvatarId());
            let pid = "";
            if (info && this._itemPlacementManager.getItemPlacementInfo(info.gridName, true)) {
                pid = info.gridName;
            }
            const placementInfo: IMyRoomFigurePlacementInfo = {
                isAvatar: !figure.isFigure(),
                avatarId: figure.getAvatarId(),
                parentId: pid,
                placeInfo: info!
            };

            if (!info) {
                console.error(`MyRoomController._makeAllFigurePlacementInfos() ==> no placeinfo avatarId=${figure.getAvatarId()}`);
            }

            result.push(placementInfo);
        });

        return result;
    }

    private _makeAllItemFunctionDatas(): IMyRoomItemFunctionData[] | undefined {
        const allData: IMyRoomItemFunctionData[] = [];

        const allItem = this._itemPlacementManager.getAllPlacedItemList();
        allItem.forEach((item) => {
            const data = item.getItemFunctionData();
            if (data) {
                allData.push(data);
            }
        });

        if (allData.length > 0) {
            return allData;
        }

        return undefined;
    }


    private _getDefaultRoomManifest(): IAssetManifest_MyRoom {
        const defaultManifest: IAssetManifest_MyRoom = {
            "format": 3,
            "main": {
                "type": "MyRoom",
                "room": {
                    "backgroundColor": "#6b8cc2ff",
                    "roomSkinId": "2NBOyh6Spw7E5QNaEr4BG4",
                    "grids": [
                        {
                            "meshName": "Floor",
                            "isFloor": true,
                            "placementType": "Floor",
                            "gridNormal": "Y",
                            "width": 20,
                            "height": 20,
                            "gridOrigin": [
                                0,
                                0.1,
                                0
                            ],
                            "markArray": []
                        },
                        {
                            "meshName": "LeftWall",
                            "isFloor": false,
                            "placementType": "Wall",
                            "gridNormal": "X",
                            "width": 20,
                            "height": 20,
                            "gridOrigin": [
                                0.1,
                                0,
                                0
                            ],
                            "markArray": []
                        },
                        {
                            "meshName": "RightWall",
                            "isFloor": false,
                            "placementType": "Wall",
                            "gridNormal": "Z",
                            "width": 20,
                            "height": 20,
                            "gridOrigin": [
                                0,
                                0,
                                0.1
                            ],
                            "markArray": []
                        }
                    ]
                },
                "defaultAvatarPos": {
                    gridName: "Floor",
                    fromX: 0,
                    toX: 4,
                    fromY: 0,
                    toY: 4,
                    rot: 0,
                }
            },
        };

        return defaultManifest;
    }

    private _test(keyEvent: BABYLON.KeyboardInfo) {
        switch (keyEvent.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                //console.log("KEY DOWN: ", keyEvent.event.key);
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                //console.log("KEY UP: ", keyEvent.event.code);
                if (keyEvent.event.code === "Space") {
                    this.getInputHandler_PlaceMode().rotateCurrentItem();
                }
                else if (keyEvent.event.code === "Delete") {
                    const curTarget = this.getInputHandler_PlaceMode().getCurrentTarget();
                    if (curTarget) {
                        if (curTarget instanceof ItemController) {
                            this.removeItem(curTarget.getItemInstanceId());
                        }
                        else if (curTarget instanceof AvatarController) {
                            this.removeFigure(curTarget.getAvatarId());
                        }
                    }
                }
                break;
        }

    }

    public _refreshCustomInspectorProperties() {
        this.inspectableCustomProperties = [];
        this._refreshCustomInspectorProperties_EditingMode(this.inspectableCustomProperties);
        this._refreshCustomInspectorProperties_LoadSavePreset(this.inspectableCustomProperties);
        this._refreshCustomInspectorProperties_ItemButtons(this.inspectableCustomProperties);
    }

    private _refreshCustomInspectorProperties_EditingMode(inspectableCustomProperties: BABYLON.IInspectable[]) {
        inspectableCustomProperties.push({
            label: this._currentMode === EMyRoomMode.View ? "배치모드 시작" : "배치모드 끝",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this.changeMode(this._currentMode === EMyRoomMode.View ? EMyRoomMode.Placement : EMyRoomMode.View);
                window.setTimeout(() => {
                    this._refreshCustomInspectorProperties();
                }, 10);

            }
        });

        inspectableCustomProperties.push({
            label: this._showGrid ? "그리드 숨기기" : "그리드 보기",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this._showGrid = !this._showGrid;
                this._itemPlacementManager.showGridMeshes(this._showGrid);
                window.setTimeout(() => {
                    this._refreshCustomInspectorProperties();
                }, 10);

            }
        });
    }

    private _refreshCustomInspectorProperties_LoadSavePreset(inspectableCustomProperties: BABYLON.IInspectable[]) {
        inspectableCustomProperties.push({
            label: "Load Preset",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadTestPreset_File(file);
            },
            accept: ".json"
        });

        inspectableCustomProperties.push({
            label: "Save Preset",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this._savePreset();
            }
        });
    }

    private _refreshCustomInspectorProperties_ItemButtons(inspectableCustomProperties: BABYLON.IInspectable[]) {
        this._testItemIds.forEach((itemId) => {
            const itemData = TableDataManager.getInstance().findItem(itemId);
            if (itemData) {
                inspectableCustomProperties.push({
                    label: `(${itemData.title}) - ${itemData.ID}}`,
                    propertyName: "",
                    type: BABYLON.InspectableType.Button,
                    callback: () => {
                        this.getItemPlacementManager().placeNewItem(itemId);
                    }
                });
            }
        });
    }

    private _loadTestPreset_File(file: File): void {
        BABYLON.Tools.ReadFile(file, (data) => {
            const testPreset = JSON.parse(data) as IAssetManifest_MyRoom;
            if (testPreset) {
                this._initModel_TestPreset(testPreset.main.room.backgroundColor, testPreset.main.room.roomSkinId, testPreset.main.room.grids, testPreset.main.items, testPreset.main.figures, testPreset.main.itemFunctionDatas, testPreset.main.environment || "", testPreset.testItems).then(() => {
                });
            }
            else {
                console.error("MyRoomController._loadTestPreset_File(): failed!!");
            }
        });
    }

    public async _initModel_TestPreset(backgroundColor: string, roomSkinId: string, roomGridInfos: IRoomGridInfo[], placedItems: IMyRoomItemPlacementInfo[] | undefined, placedFigures: IMyRoomFigurePlacementInfo[] | undefined, itemFunctionDatas: IMyRoomItemFunctionData[] | undefined, environment: string, testItems: string[] | undefined): Promise<void> {
        this._testItemIds = testItems || [];
        this._refreshCustomInspectorProperties();
        this.initModel(backgroundColor, roomSkinId, roomGridInfos, environment).then(() => {
            if (placedItems) {
                this.placeItems(placedItems).then(() => {
                    if (itemFunctionDatas) {
                        itemFunctionDatas.forEach((data) => {
                            const itemController = this._itemPlacementManager.getPlacedItemController(data.instanceId);
                            if (itemController) {
                                itemController.doItemFunction(data);
                            }
                        });
                    }
                });
            }

            if (placedFigures) {
                this.placeFigures(placedFigures, false);
            }
        });
    }

    private _savePreset() {
        const preset = this.makeMyRoomManifest();
        const jsonPreset = JSON.stringify(preset, undefined, 4);
        const blob = new Blob([jsonPreset], { type: "application/json" });
        BABYLON.Tools.Download(blob, "myRoomPreset.json");
    }

    private _getFloorGridSize(): { w: number, h: number; } {
        const floorGridInfo = this._roomGridInfos.find((g) => g.meshName === "Floor");
        if (floorGridInfo) {
            return { w: floorGridInfo.width, h: floorGridInfo.height };
        }

        return { w: 0, h: 0 };
    }

    public isMultiTouching(): boolean {
        return this._multiTouchChecker.isMultiTouching();
    }

    public getBoundingInfo(): BABYLON.BoundingInfo {
        let { w, h } = this._getFloorGridSize();
        w *= Constants.MYROOM_GRID_UNIT_SIZE;
        h *= Constants.MYROOM_GRID_UNIT_SIZE;
        // 살짝 크게 한다. 그래야 벽까지 담을 수 있다.
        const offset = Constants.MYROOM_GRID_UNIT_SIZE;
        return new BABYLON.BoundingInfo(new BABYLON.Vector3(-w - offset, -offset, -offset), new BABYLON.Vector3(offset, Constants.MYROOM_FLOOR_SIZE_METER + offset, h + offset));
    }

    //icon gnerator 지원
    public async loadModelFromManifest(mainfest: IAssetManifest_MyRoom) {
        await this.initModel(mainfest.main.room.backgroundColor, mainfest.main.room.roomSkinId, mainfest.main.room.grids, "ignore").then(() => {
            const placedItems = mainfest.main.items;
            const itemFunctionDatas = mainfest.main.itemFunctionDatas;
            if (placedItems) {
                this.placeItems(placedItems).then(() => {
                    if (itemFunctionDatas) {
                        itemFunctionDatas.forEach((data) => {
                            const itemController = this._itemPlacementManager.getPlacedItemController(data.instanceId);
                            if (itemController) {
                                itemController.doItemFunction(data);
                            }
                        });
                    }
                });
            }
        });
    }

    private _getCameraDefaultMode(): ECameraMode {
        switch (this._serviceType) {
            case ConstantsEx.SERVICE_JOYSAM:
                return ECameraMode.Joysam;
            default:
                return ECameraMode.MyRoom;
        }
    }

}