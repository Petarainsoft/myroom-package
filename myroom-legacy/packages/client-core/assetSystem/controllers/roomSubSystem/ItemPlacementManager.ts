import * as BABYLON from "@babylonjs/core";
import { MyRoomController } from "../myRoomController";
import { IMyRoomFigurePlacementInfo, IMyRoomItemPlacementInfo, IMyRoomPlacementInfo, IMyRoomItemFunctionData } from "../../jsonTypes/manifest/assetManifest_MyRoom";
import { ItemController } from "../itemController";
import { IAssetLoader, eGridNormal, ePlacementRotationType } from "../../definitions";
import { GridManager, IFindValidPositionResult, IGridPickingInfo, IRoomMeshInfo } from "./GridManager";
import { Grid } from "./GridManager_Grid";
import { Constants } from "../../constants";
import { AvatarController } from "../avatarController";
import { TableDataManager } from "../../../tableData/tableDataManager";
import { EPlacementAttachType } from "../../../tableData/defines/System_Enum";
import { uuidToBase62V2 } from "../../../common/utils";

export class RemoveInfo {
    private _isFigure: boolean;
    private _id: string;
    private _itemId: string;
    private _itemData: IMyRoomItemFunctionData|null = null;

    public isFigure(): boolean {
        return this._isFigure;
    }

    public getId(): string {
        return this._id;
    }

    public getItemId(): string {
        return this._itemId;
    }

    public getItemData(): IMyRoomItemFunctionData|null {
        return this._itemData;
    }

    public constructor(isFigure: boolean, id: string, itemId: string, itemData: IMyRoomItemFunctionData|null) {
        this._isFigure = isFigure;
        this._id = id;
        this._itemId = itemId;
        this._itemData = itemData;
    }
}

class KeepItemInfo {
    private _placeInfo: IMyRoomItemPlacementInfo;
    private _itemController: ItemController;

    constructor(placeInfo: IMyRoomItemPlacementInfo, itemController: ItemController) {
        this._placeInfo = placeInfo;
        this._itemController = itemController;
    }
}

export class ItemPlacementManager {
    private _owner: MyRoomController;
    private _assetLoader: IAssetLoader;
    private _scene: BABYLON.Scene;
    private _gridManager: GridManager;

    private _allItems: Map<string, ItemController> = new Map<string, ItemController>();
    private _allFigures: Map<string, AvatarController> = new Map<string, AvatarController>();

    private _backPackItems: Map<string, ItemController> = new Map<string, ItemController>();
    private _backPackFigures: Map<string, AvatarController> = new Map<string, AvatarController>();

    public onDeleted: BABYLON.Observable<RemoveInfo> = new BABYLON.Observable<RemoveInfo>();

    constructor(owner: MyRoomController, assetLoader: IAssetLoader) {
        this._owner = owner;
        this._assetLoader = assetLoader;
        this._scene = this._owner._scene;
        this._gridManager = new GridManager(this, this._scene);
    }

    public finalize() {
        this._gridManager.finalize();

        this._allItems.forEach((c) => { c.dispose(); });
        this._allItems.clear();

        this._allFigures.forEach((c) => { c.dispose(); });
        this._allFigures.clear();

        this._backPackItems.forEach((c) => { c.dispose(); });
        this._backPackItems.clear();

        this._backPackFigures.forEach((c) => { c.dispose(); });
        this._backPackFigures.clear();
    }

    // backpack에 잠시 keep해두었다가, room skin변경후에 다시 배치해준다.
    public beforeChangeRoomSkin(_placeInfos?: IMyRoomItemPlacementInfo[], _allFigurePlaceInfos?: IMyRoomFigurePlacementInfo[]) {
        this._allItems.forEach((value, key) => {
            const info = _placeInfos?.find((v) => v.instanceId === key);
            if (info) value.setKeepPlaceInfo(info);

            this._backPackItems.set(key, value);
        });
        this._allFigures.forEach((value, key) => {
            const info = _allFigurePlaceInfos?.find((v) => v.avatarId === key);
            if (info) value.setKeepPlaceInfo(info);

            this._backPackFigures.set(key, value);
        });

        this._allItems.clear();
        this._allFigures.clear();

        this._gridManager.finalize();

        console.log("beforeChangeRoomSkin", this._backPackItems.size);
    }

    public async afterChangeRoomSkin() {
        const processes: Promise<void>[] = [];

        const tempItemMap = new Map(this._backPackItems);
        this._backPackItems.clear();
        tempItemMap.forEach((value, key) => {
            const info = value.getKeepPlaceInfo();
            if (info) {
                const process = async () => {
                    value.setEnabled(true);
                    const success = await this.placeItem(value, {
                        itemId: value.getItemId(),
                        instanceId: value.getItemInstanceId(),
                        parentId: info.parentId,
                        placeInfo: info.placeInfo
                    }, false);
                    // 배치에 실패하면, 다시 backPack에 넣어둔다.
                    if (!success) {
                        this._backPackItems.set(info.instanceId, value);
                    } else {
                        value.addToShadowMapRenderList();
                    }
                };
                processes.push(process());
            } else {
                console.error("afterChangeRoomSkin - no item placeInfo", key);
            }
        });

        const tempFigureMap = new Map(this._backPackFigures);
        this._backPackFigures.clear();
        tempFigureMap.forEach((value, key) => {
            const info = value.getKeepPlaceInfo();
            if (info) {
                const process = async () => {
                    value.setEnabled(true);
                    const success = await this.placeFigrue(value, {
                        avatarId: value.getAvatarId(),
                        parentId: info.parentId,
                        isAvatar: info.isAvatar,
                        placeInfo: info.placeInfo
                    }, false);
                    // 배치에 실패하면, 다시 backPack에 넣어둔다.
                    if (!success) {
                        this._backPackFigures.set(info.avatarId, value);
                    } else {
                        value.addToShadowMapRenderList();
                    }
                };
                processes.push(process());
            }
            else {
                console.error("afterChangeRoomSkin - no figure placeInfo", key);
            }
        });

        if (processes.length > 0) await Promise.all(processes);

        console.log("afterChangeRoomSkin", this._backPackItems.size);
    }

    public initialize(roomGridInfos: IRoomMeshInfo[]) {
        this._gridManager.initialize(roomGridInfos);
    }

    public getGrid(name: string): Grid | undefined {
        return this._gridManager.getGridByName(name);
    }

    public getOwner(): MyRoomController {
        return this._owner;
    }

    public getPlacedItemController(itemInstanceId: string): ItemController | undefined {
        return this._allItems.get(itemInstanceId);
    }

    public getPlacedAvatarController(avatarId: string): AvatarController | undefined {
        return this._allFigures.get(avatarId);
    }

    public startRoom() {
        this._allItems.forEach((c) => {
            c.doItemFunction(c.getItemFunctionData());
        });
    }


    //-----------------------------------------------------------------------------------
    // Item 배치
    //-----------------------------------------------------------------------------------
    public async placeItems(_placeInfos: IMyRoomItemPlacementInfo[], functionDatas?: IMyRoomItemFunctionData[], playAnimation?: boolean): Promise<void> {
        const processes = [];
        for (let ii = 0; ii < _placeInfos.length; ++ii) {
            const info = _placeInfos[ii];
            const itemController = new ItemController(info.instanceId, info.itemId, this._scene, this._assetLoader, this._owner.getRoomContext(), this._owner);
            //await itemController.initModel(); //=> 순서변경 모델 로딩 분리

            //=> await 처리해야 기능성 아이템들의 메터리얼 찿기가 된다 ㅠㅠ
            const process = async () => {
                const success = await this.placeItem(itemController, {
                    itemId: itemController.getItemId(),
                    instanceId: itemController.getItemInstanceId(),
                    parentId: info.parentId,
                    placeInfo: info.placeInfo
                });

                if (playAnimation) {
                    itemController.prepareLoadingAnimation();
                }

                await itemController.initModel();

                functionDatas?.filter((v) => v.instanceId === info.instanceId).forEach((v) => {
                    itemController.doItemFunction(v);
                });

                if (!success) {
                    console.error(`ItemPlacementManager.placeItems() => error instanceId = ${info.instanceId}, itemId = ${info.itemId}`);
                }
            };
            processes.push(process());
        }

        if (processes.length > 0) await Promise.all(processes);
    }

    public async playItemLoadingAnimation() {
        const ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        const processes: Promise<void>[] = [];
        let index = 0;
        this._allItems.forEach((v) => {
            processes.push(v.playLoadingAnimation((index++) * Constants.EACH_LOADING_BASE_WAIT_TIME, ease, Constants.PLAY_LOADING_ANIMATION_SPEED, Constants.PLAY_LOADING_FRAME));
        });

        if (processes.length > 0) await Promise.all(processes);
    }

    public async placeNewItem(itemId: string, itemInstanceId?: string): Promise<string> {
        const itemData = TableDataManager.getInstance().findItem(itemId);
        if (itemData && itemData.sw > 0 && itemData.sh > 0) {
            const result = this._gridManager.findEmptyPosition(itemData.placement_attach_type, itemData.sw, itemData.sh);
            if (result.success) {
                let parentId = "";
                const parentItemController = result.grid!.getOwnerNode();
                if (parentItemController instanceof ItemController) {
                    parentId = parentItemController.getItemInstanceId(); //grid 명으로 해도 될듯..
                }

                //Model 생성
                const itemController = new ItemController(itemInstanceId ?? this._generateNewItemInstanceId(), itemId, this._scene, this._assetLoader, this._owner.getRoomContext(), this._owner);
                await itemController.initModel();

                return this.placeItem(itemController, {
                    itemId: itemController.getItemId(),
                    instanceId: itemController.getItemInstanceId(),
                    parentId: parentId,
                    placeInfo: {
                        fromX: result.fromX,
                        toX: result.toX,
                        fromY: result.fromY,
                        toY: result.toY,
                        gridName: result.grid!.getName(),
                        rot: result.rotateToFit ? ePlacementRotationType.Rot_90 : ePlacementRotationType.Rot_0
                    }
                });
            }

            console.error(`ItemPlacementManager.placeNewItem() => failed to find empty position, ${itemId} , ${itemData.placement_attach_type}, ${itemData.sw}, ${itemData.sh}}`);
            return "";
        }

        console.error(`ItemPlacementManager.placeNewItem() => ${itemId} has no bounding info`);
        return "";
    }

    public async placeItem(itemController: ItemController, itemPlaceInfo: IMyRoomItemPlacementInfo, disposeIfError: boolean = true): Promise<string> {

        //Parent 연결
        if (itemPlaceInfo.parentId) {
            const parent = this._allItems.get(itemPlaceInfo.parentId);
            if (parent) {
                itemController.parent = parent;
            }
        }

        //위치
        const pos = new BABYLON.Vector3();

        if (!itemPlaceInfo.placeInfo) {
            console.error("ItemPlacementManager.placeItem() => no plcementInfo", itemController.getItemId());
            if (disposeIfError) itemController.dispose();
            else itemController.setEnabled(false);
            return "";
        }


        if (!this._gridManager.calucateAbsoltePostion(itemPlaceInfo.placeInfo.gridName, itemPlaceInfo.placeInfo.fromX, itemPlaceInfo.placeInfo.toX, itemPlaceInfo.placeInfo.fromY, itemPlaceInfo.placeInfo.toY, pos)) {
            console.error("ItemPlacementManager.placeItem() => check !!!!!");
            if (disposeIfError) itemController.dispose();
            else itemController.setEnabled(false);
            return "";
        }

        this._setItemAbsolutePosition(itemController, pos);
        this._gridManager.placeItem(itemPlaceInfo.placeInfo.gridName, itemController.getItemInstanceId(), itemPlaceInfo.placeInfo.fromX, itemPlaceInfo.placeInfo.toX, itemPlaceInfo.placeInfo.fromY, itemPlaceInfo.placeInfo.toY);

        //회전
        itemController.setPlacementRotation(itemPlaceInfo.placeInfo.rot);

        if (itemController.getPlacementAttachType() === EPlacementAttachType.Wall) {
            const grid = this._gridManager.getGridByName(itemPlaceInfo.placeInfo.gridName);
            if (grid) {
                if (grid.getGridNormal() === eGridNormal.X) {
                    itemController.aligneDir(BABYLON.Vector3.Right());
                }
                else if (grid.getGridNormal() === eGridNormal.Z) {
                    itemController.aligneDir(BABYLON.Vector3.Backward());
                }
            }
        }

        //Grid 추가 (Item이 Grid가 있다면 Desk 타입 뿐이다)
        if (itemController.hasGrid()) {
            const gridInfos = itemController.getGridInfos();
            for (let ii = 0; ii < gridInfos.length; ++ii) {
                const info = gridInfos[ii];
                if (info.gridSizeWidth > 0 && info.gridSizeHeight > 0) {
                    // 아이템 그리드 이름 규칙 => 아이템 인스턴스 아이디+[grid index] 로 사용한다. ==> 처음 그리드는 제외한다. 기존의 데이터와 충돌하지 않게 하기위해서 첫 그리드는 [grid index]를 붙이지 않는다.
                    let gridName = ii == 0 ? itemController.getItemInstanceId() : `${itemController.getItemInstanceId()}[${ii}]`;
                    if (!this._gridManager.getGridByName(gridName)) {
                        this._gridManager.addNewGrid(gridName, EPlacementAttachType.Desk, eGridNormal.Y, itemController,
                            info.gridSizeWidth, info.gridSizeHeight, info.gridOrigin, GridManager.convertNumberArrayToGridMarkArray(info.gridMarkArray));
                    }
                }
                else {
                    console.error(`ItemPlacementManager.PlaceItem() : itemController.getGridSizeWidth() > 0 && itemController.getGridSizeHeight() > 0 ==> false ,itemId=${itemController.getItemId()}`);
                }

            }
        }

        this._allItems.set(itemPlaceInfo.instanceId, itemController);
        return itemPlaceInfo.instanceId;
    }

    public removeItem(instanceId: string, destroy: boolean = true) {
        const itemController = this._allItems.get(instanceId);
        if (destroy && itemController) {
            console.log("===== move child");
            //재귀적으로 child 부터 제거하자. //==> 선반위에 선반 테스트 해봐야한다!!!!
            const allChildItems = itemController?.getAllChildItemsForDelete();
            if (allChildItems) {
                for (let cc = allChildItems.length - 1; cc >= 0; --cc) {
                    this.removeItem(allChildItems[cc].getItemInstanceId(), destroy);
                }
            }

            //figure 제거
            const allChildFigures = itemController?.getAllChildFiguresForDelete();
            if (allChildFigures) {
                for (let cc = allChildFigures.length - 1; cc >= 0; --cc) {
                    this.removeFigure(allChildFigures[cc].getAvatarId(), destroy);
                }
            }
        }
        this._gridManager.removeItem(instanceId, destroy);
        if (destroy && itemController) {
            //itemController.destroyWithAllChildItems();

            this.deleted(itemController);

            itemController.dispose();
        }
        this._allItems.delete(instanceId);
        console.log(`====> removed item ${instanceId}`);
    }


    public removeGrid(gridName: string) {
        //아이템 이동 처리중 그리드를 제거하지 않기 때문에 아이템 제거시 명확하게 제거해 줘야한다.
        this._gridManager.removeGrid(gridName);
    }

    public getItemPlacementInfo(itemInstanceId: string, checkParentItem = false): IMyRoomPlacementInfo | undefined {
        const controller = this._allItems.get(itemInstanceId);
        if (controller) {
            const placeInfo = this._gridManager.getItemPlacementInfo(itemInstanceId);
            if (placeInfo) {
                placeInfo.rot = controller.getPlacementRotationType();
                return placeInfo;
            }
            else {
                console.error(`ItemPlacementManager.getItemPlacementInfo()=> no placeInfo, ${itemInstanceId}`);
            }
        }
        else {
            if (checkParentItem) {
                console.warn(`ItemPlacementManager.getItemPlacementInfo()=> no controller,${itemInstanceId}`);
            }
        }

        return undefined;
    }

    public getAllPlacedItemList(): ItemController[] {
        const list: ItemController[] = [];
        this._allItems.forEach((v) => { list.push(v); });
        return list;
    }

    public findAllItemsByItemId(itemId: string): ItemController[] {
        const list: ItemController[] = [];
        this._allItems.forEach((v) => {
            if (v.getItemId() === itemId) {
                list.push(v);
            }
        });
        return list;
    }

    public showGridMeshes(show: boolean) {
        this._gridManager.showGridMeshes(show);
    }

    //-----------------------------------------------------------------------------------
    // Figure 배치
    //-----------------------------------------------------------------------------------
    public async placeFigures(_allFigurePlaceInfos: IMyRoomFigurePlacementInfo[], forRoomCoordi: boolean, playAnimation?: boolean): Promise<void> {
        const processes = [];
        for (let ii = 0; ii < _allFigurePlaceInfos.length; ++ii) {
            const info = _allFigurePlaceInfos[ii];
            if (forRoomCoordi && !info.isAvatar) {
                continue; //룸코디일경우 아바타 정보 빼고 한다
            }

            const avatarController = new AvatarController(info.avatarId, this._scene, this._assetLoader, this._owner.getRoomContext(), this._owner);
            if (forRoomCoordi) {
                avatarController.setEnabled(false);
            }

            !info.isAvatar && avatarController.markAsFigure();

            const process = async () => {
                const success = await this.placeFigrue(avatarController, {
                    avatarId: avatarController.getAvatarId(),
                    parentId: info.parentId,
                    isAvatar: info.isAvatar,
                    placeInfo: info.placeInfo
                });

                if (playAnimation) avatarController.prepareLoadingAnimation();

                await avatarController.initModel();

                if (!success) {
                    console.error(`ItemPlacementManager.placeFigures() => error avatarId = ${info.avatarId}`);
                }
            };
            processes.push(process());
        }

        if (processes.length > 0) await Promise.all(processes);
    }

    public async playFigureLoadingAnimation() {
        const ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        const processes: Promise<void>[] = [];
        let index = 0;
        this._allFigures.forEach((v) => {
            processes.push(v.playLoadingAnimation((index++) * Constants.EACH_LOADING_BASE_WAIT_TIME, ease, Constants.PLAY_LOADING_ANIMATION_SPEED, Constants.PLAY_LOADING_FRAME));
        });

        if (processes.length > 0) await Promise.all(processes);
    }

    public async placeNewFigure(figureId: string, isAvatar: boolean): Promise<string> {
        if (this._gridManager.isAlreadyPlaced(figureId)) {
            console.error(`ItemPlacementManager.placeNewFigure() => ${figureId} is already placed!`);
            return "";
        }
        const gridUnit = isAvatar ? Constants.MYROOM_AVATAR_GRID_UNIT : Constants.MYROOM_FIGURE_GRID_UNIT;
        const result = this._gridManager.findEmptyPosition(isAvatar ? EPlacementAttachType.Floor : EPlacementAttachType.Desk, gridUnit, gridUnit);
        if (result.success) {
            let parentId = "";
            const parentItemController = result.grid!.getOwnerNode();
            if (parentItemController instanceof ItemController) {
                parentId = parentItemController.getItemInstanceId(); //grid 명으로 해도 될듯..
            }

            const avatarController = new AvatarController(figureId, this._scene, this._assetLoader, this._owner.getRoomContext(), this._owner);
            !isAvatar && avatarController.markAsFigure();
            await avatarController.initModel();

            return this.placeFigrue(avatarController, {
                avatarId: figureId,
                isAvatar: isAvatar,
                parentId: parentId,
                placeInfo: {
                    fromX: result.fromX,
                    toX: result.toX,
                    fromY: result.fromY,
                    toY: result.toY,
                    gridName: result.grid!.getName(),
                    rot: result.rotateToFit ? ePlacementRotationType.Rot_180 : ePlacementRotationType.Rot_0
                }
            });
        }

        console.error(`ItemPlacementManager.placeNewFigure() => ${figureId} has no bounding info`);
        return "";
    }

    public async placeFigrue(avatarController: AvatarController, figurePlaceInfo: IMyRoomFigurePlacementInfo, disposeIfError: boolean = true): Promise<string> {
        //Parent 연결 ==> figure도 아이템 위에 배치 가능하도록 수정
        if (figurePlaceInfo.parentId) {
            const parent = this._allItems.get(figurePlaceInfo.parentId);
            if (parent) {
                avatarController.parent = parent;
            }
        }

        if (!figurePlaceInfo.placeInfo) {
            console.error("ItemPlacementManager.placeFigrue() => no plcementInfo", avatarController.getAvatarId());
            if (disposeIfError) avatarController.dispose();
            else avatarController.setEnabled(false);
            return "";
        }

        //위치
        const pos = new BABYLON.Vector3();
        //const rot = BABYLON.Quaternion.FromEulerAngles(0, 0, 0);
        if (!this._gridManager.calucateAbsoltePostion(figurePlaceInfo.placeInfo.gridName, figurePlaceInfo.placeInfo.fromX, figurePlaceInfo.placeInfo.toX, figurePlaceInfo.placeInfo.fromY, figurePlaceInfo.placeInfo.toY, pos)) {
            if (disposeIfError) avatarController.dispose();
            else avatarController.setEnabled(false);
            return "";
        }

        this._setItemAbsolutePosition(avatarController, pos);
        this._gridManager.placeFigure(figurePlaceInfo.placeInfo.gridName, avatarController.getAvatarId(), figurePlaceInfo.placeInfo.fromX, figurePlaceInfo.placeInfo.toX, figurePlaceInfo.placeInfo.fromY, figurePlaceInfo.placeInfo.toY);

        //회전
        avatarController.setPlacementRotation(figurePlaceInfo.placeInfo.rot);

        this._allFigures.set(figurePlaceInfo.avatarId, avatarController);
        return figurePlaceInfo.avatarId;
    }

    public removeFigure(figureId: string, distroy: boolean = true) {
        this._gridManager.removeFigure(figureId);
        const avatarController = this._allFigures.get(figureId);
        if (distroy && avatarController) {
            this.deleted(avatarController);
            avatarController.dispose();
        }
        this._allFigures.delete(figureId);
        console.log(`====> removed figure ${figureId}`);
    }

    public getFigurePlacementInfo(figureId: string): IMyRoomPlacementInfo | undefined {
        const controller = this._allFigures.get(figureId);
        if (controller) {
            const placeInfo = this._gridManager.getFigurePlacementInfo(figureId);
            if (placeInfo) {
                placeInfo.rot = controller.getPlacementRotationType();
                return placeInfo;
            }
            else {
                console.error(`ItemPlacementManager.getFigurePlacementInfo() => placeInfo is null`);
            }
        }

        return undefined;
    }

    public getAllPlacedFigureList(): AvatarController[] {
        const list: AvatarController[] = [];
        this._allFigures.forEach((v) => { list.push(v); });
        return list;
    }

    public addCallbackRemoveChanged(callback: (info: RemoveInfo) => void) {
        this.onDeleted.add(callback);
    }

    public removeCallbackRemoveChanged(callback: (info: RemoveInfo) => void) {
        this.onDeleted.removeCallback(callback);
    }

    public deleted(instance:ItemController|AvatarController) {
        if (instance instanceof ItemController) {
            this.onDeleted.notifyObservers(new RemoveInfo(false, instance.getItemInstanceId(), instance.getItemId(), instance.getItemFunctionData()));
        }
        else if (instance instanceof AvatarController) {
            this.onDeleted.notifyObservers(new RemoveInfo(true, instance.getAvatarId(), "", null));
        }
    }

    //-----------------------------------------------------------------------------------
    // Area 확인
    //-----------------------------------------------------------------------------------
    public isEmptyArea(gridName: string, fromX: number, toX: number, fromY: number, toY: number): boolean {
        return this._gridManager.isEmptyArea(gridName, fromX, toX, fromY, toY);
    }

    public findBestPostion(ray: BABYLON.Ray, placementTypes: EPlacementAttachType[], w: number, h: number): IFindValidPositionResult {
        return this._gridManager.findBestPostion(ray, placementTypes, w, h);
    }

    //-----------------------------------------------------------------------------------
    // Pick Grid
    //-----------------------------------------------------------------------------------
    public pickGrid(ray: BABYLON.Ray, placementTypes: EPlacementAttachType[]): IGridPickingInfo {
        return this._gridManager.pickGrid(ray, placementTypes);
    }

    public pick(x: number, y: number, placementTypes: EPlacementAttachType[]): IGridPickingInfo {
        return this._gridManager.pick(x, y, placementTypes);
    }

    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------
    private _setItemAbsolutePosition(targetNode: BABYLON.TransformNode, absolutePos: BABYLON.Vector3) {
        targetNode.setAbsolutePosition(absolutePos);
    }

    private _generateNewItemInstanceId(): string {
        //return BABYLON.GUID.RandomId();
        const uuid = BABYLON.GUID.RandomId();
        return uuidToBase62V2(uuid) || uuid;
    }
}