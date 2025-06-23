import * as BABYLON from "@babylonjs/core";
import { MyRoomController } from "../myRoomController";
import { ItemController } from "../itemController";
import { AvatarController } from "../avatarController";
import { ItemPlacementManager } from "./ItemPlacementManager";
import { GridDisplayer } from "./GridDisplayer";
import { eGridNormal, ePlacementRotationType, eRoomObjectType } from "../../definitions";
import { RoomOject } from "./roomObject";
import { Constants } from "../../constants";
import { IMyRoomFigurePlacementInfo, IMyRoomItemPlacementInfo, IMyRoomPlacementInfo } from "../../jsonTypes/manifest/assetManifest_MyRoom";
import { Grid } from "./GridManager_Grid";
import { InputManager } from "@babylonjs/core/Inputs/scene.inputManager";
import { TableDataManager } from "../../../tableData/tableDataManager";
import { EPlacementAttachType } from "../../../tableData/defines/System_Enum";
import { IMyRoomCommandRecordingData, MyRoomCommandRecorder } from "../../../myRoomCommandRecorder";

class MyHighlightLayer extends BABYLON.HighlightLayer {
    // 기존 코드에서 stencil op 값을 항상 replace되도록 변경함. 그래야 다른 물체에 가려도 stencil ref값으로 설정됨.
    public addMesh(mesh: BABYLON.Mesh, color: BABYLON.Color3, glowEmissiveOnly = false) {
        const superAsAny = this as any;
        if (!superAsAny._meshes) {
            return;
        }

        const meshHighlight = superAsAny._meshes[mesh.uniqueId];
        if (meshHighlight) {
            meshHighlight.color = color;
        } else {
            let prevFailValue: number | undefined;
            let prevDepthFailValue: number | undefined;
            superAsAny._meshes[mesh.uniqueId] = {
                mesh: mesh,
                color: color,
                // Lambda required for capture due to Observable this context
                observerHighlight: mesh.onBeforeBindObservable.add((mesh: BABYLON.Mesh) => {
                    if (this.isEnabled) {
                        if (superAsAny._excludedMeshes && superAsAny._excludedMeshes[mesh.uniqueId]) {
                            superAsAny._defaultStencilReference(mesh);
                        } else {
                            const engine = mesh.getScene().getEngine();
                            prevFailValue = engine.getStencilOperationFail();
                            prevDepthFailValue = engine.getStencilOperationDepthFail();
                            engine.setStencilOperationPass(BABYLON.Constants.REPLACE);
                            engine.setStencilOperationFail(BABYLON.Constants.REPLACE);
                            engine.setStencilOperationDepthFail(BABYLON.Constants.REPLACE);
                            engine.setStencilFunctionReference(superAsAny._instanceGlowingMeshStencilReference);
                        }
                    }
                }),
                observerDefault: mesh.onAfterRenderObservable.add((mesh: BABYLON.Mesh) => {
                    if (this.isEnabled) {
                        superAsAny._defaultStencilReference(mesh);
                        const engine = mesh.getScene().getEngine();
                        if (prevFailValue) {
                            engine.setStencilOperationFail(prevFailValue);
                            prevFailValue = undefined;
                        }
                        if (prevDepthFailValue) {
                            engine.setStencilOperationDepthFail(prevDepthFailValue);
                            prevDepthFailValue = undefined;
                        }
                    }
                }),
                glowEmissiveOnly: glowEmissiveOnly,
            };

            mesh.onDisposeObservable.add(() => {
                this._disposeMesh(mesh);
            });
        }

        this._shouldRender = true;
    }
}

export class SelectionInfo {
    private _isFigure: boolean;
    private _id: string;
    private _itemId: string;
    private _isOutside: boolean;

    public isFigure(): boolean {
        return this._isFigure;
    }

    public getId(): string {
        return this._id;
    }

    public getItemId(): string {
        return this._itemId;
    }

    public isOutside(): boolean {
        return this._isOutside;
    }

    public constructor(isFigure: boolean, id: string, itemId: string, isOutside:boolean) {
        this._isFigure = isFigure;
        this._id = id;
        this._itemId = itemId;
        this._isOutside = isOutside;
    }
}

export class DragInfo {
    private _isFigure: boolean;
    private _id: string;
    private _itemId: string;
    private _isDragging: boolean;

    public isFigure(): boolean {
        return this._isFigure;
    }

    public getId(): string {
        return this._id;
    }

    public getItemId(): string {
        return this._itemId;
    }

    public isDragging(): boolean {
        return this._isDragging;
    }

    public constructor(isFigure: boolean, id: string, itemId: string, isDragging: boolean) {
        this._isFigure = isFigure;
        this._id = id;
        this._itemId = itemId;
        this._isDragging = isDragging;
    }
}


export interface ICheckGridAreaResult {
    hitGrid: Grid | null,
    hitPos: BABYLON.Vector3,
    hitCellPosX: number,
    hitCellPosY: number,
    isValidArea: boolean,
    areaFromX: number,
    areaToX: number,
    areaFromY: number,
    areaToY: number,
}

export class InputHandler_PlaceMode {
    private _owner: MyRoomController;
    private _scene: BABYLON.Scene;
    private _itemPlacementManager: ItemPlacementManager;
    private _targetContext: BABYLON.Nullable<TargetContext>;
    private _gridDisplayer: GridDisplayer;
    private _pickingGuardWallMeshes: BABYLON.Mesh[] = [];
    private _isHandlerEnabled: boolean = false;
    private _pointerObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>> = null;
    private _longPressTimer: BABYLON.Nullable<number> = null;
    private _pickingGuardWallTop: BABYLON.Nullable<BABYLON.TransformNode> = null;

    public constructor(owner: MyRoomController, scene: BABYLON.Scene) {
        this._owner = owner;
        this._scene = scene;

        this._itemPlacementManager = this._owner.getItemPlacementManager();
        this._targetContext = new TargetContext(this._scene, this._itemPlacementManager);
        this._gridDisplayer = new GridDisplayer(this._owner, this._scene);

        this._createPickingGuardWall();
    }

    public finalize() {
        this.enableHandler(false);

        this._targetContext?.dispose();
        this._targetContext = null;

        this._gridDisplayer.finalize();
        this._pickingGuardWallMeshes.forEach((m) => { m.dispose(); });
    }

    public beforeChangeRoomSkin() {
    }
    public afterChangeRoomSkin() {
    }

    public enableHandler(bEnable: boolean) {
        this._isHandlerEnabled = bEnable;
        if (this._isHandlerEnabled) {
            this._registerPointerHandlers();
        }
        else {
            this._targetContext!.clearTarget();
            this._unregisterPointerHanders();
        }
        this._pickingGuardWallTop?.setEnabled(bEnable);
    }

    public onItemLongPressed(_item: RoomOject | null) {
        //==> 자꾸 씹히는듯 해서 직접 구현함
        // if (item && item === this._targetContext.getTarget()) {
        //     if (this._targetContext.startMovingState()) {
        //         this._processStartMoving();
        //     }
        // }
    }

    public rotateCurrentItem() {
        if (!this._isHandlerEnabled) {
            console.error("ItemMoveHandler.rotateCurrentItem() : disabled handler!!!");
            return;
        }

        const target = this._targetContext!.getTarget();
        if (target && target.getPlacementAttachType() != EPlacementAttachType.Wall) {
            if (target instanceof ItemController) {
                this._itemPlacementManager.removeItem(target.getItemInstanceId(), false);
                const isSquare = target.getPlacementWidth() === target.getPlacementHeight();
                let nextRot = this._getNextRotationType_Item(target.getPlacementRotationType(), isSquare);
                let areaResult = this._checkGridArea(target, nextRot);
                if (!areaResult.isValidArea) {
                    nextRot = this._getNextRotationType_Item(nextRot, isSquare);
                    areaResult = this._checkGridArea(target, nextRot);
                }
                const pId = this._getParentIdByGridName(areaResult.hitGrid!.getName());
                const placeInfo = this._makeItemPlacementInfo(target.getItemId(), target.getItemInstanceId(), pId, areaResult.hitGrid!.getName(),
                    areaResult.areaFromX, areaResult.areaToX, areaResult.areaFromY, areaResult.areaToY, nextRot);
                this._itemPlacementManager.placeItem(target, placeInfo);
            }
            else if (target instanceof AvatarController) {
                this._itemPlacementManager.removeFigure(target.getAvatarId(), false);
                let nextRot = this._getNextRotationType_Figure(target.getPlacementRotationType());
                let areaResult = this._checkGridArea(target, nextRot);
                if (!areaResult.isValidArea) {
                    nextRot = this._getNextRotationType_Figure(nextRot);
                    areaResult = this._checkGridArea(target, nextRot);
                }
                const pId = this._getParentIdByGridName(areaResult.hitGrid!.getName());
                const placeInfo = this._makeFigurePlacementInfo(!target.isFigure(), target.getAvatarId(), pId, areaResult.hitGrid!.getName(),
                    areaResult.areaFromX, areaResult.areaToX, areaResult.areaFromY, areaResult.areaToY, nextRot);
                this._itemPlacementManager.placeFigrue(target, placeInfo);
            }
        }
    }

    public addCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this._targetContext!.onSelectionChanged.add(callback);
    }

    public removeCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this._targetContext!.onSelectionChanged.removeCallback(callback);
    }

    public addCallbackDragChanged(callback: (info: DragInfo) => void) {
        this._targetContext!.onDragChanged.add(callback);
    }

    public removeCallbackDragChanged(callback: (info: DragInfo) => void) {
        this._targetContext!.onDragChanged.removeCallback(callback);
    }

    public selectTarget(target: RoomOject) {

        this._targetContext!.selectTarget(target);
    }

    public deselectTarget() {
        this._targetContext!.clearTarget();
    }

    public repositionPickingGuardWall() {
        const GUARD_WALL_SIZE: number = 100;
        const pos = GUARD_WALL_SIZE * 0.5;

        this._pickingGuardWallMeshes[0].setAbsolutePosition(new BABYLON.Vector3(-pos, 0, pos));
        this._pickingGuardWallMeshes[1].setAbsolutePosition(new BABYLON.Vector3(0, pos, pos));
        this._pickingGuardWallMeshes[2].setAbsolutePosition(new BABYLON.Vector3(-pos, pos, 0));
    }

    public getCurrentTarget(): RoomOject | null {
        const target = this._targetContext!.getTarget();
        return target;
    }

    public handleRecordingData(data: IMyRoomCommandRecordingData) {

        switch (data.commandName) {
            case "InputAction_SelectTarget":
                if (data.param.isFigure) {
                    const figure = this._owner.findAvatarController(data.param.id);;
                    figure && this._targetContext?.selectTarget(figure);
                }
                else {
                    const item = this._owner.findItemController(data.param.id);
                    if (item) {
                        this._targetContext?.selectTarget(item);
                    }
                    else {
                        console.error(data.param.id);
                    }
                }
                break;

            case "InputAction_ClearTarget":
                this._targetContext?.clearTarget();
                break;

            case "InputAction_RemoveItem":
                this._itemPlacementManager.removeItem(data.param.id, false); //placementManger에서는 이미 제거 되었다.
                break;

            case "InputAction_MoveItem":
                {
                    if (this._targetContext) {
                        const target = this._targetContext.getTarget();
                        if (target && target instanceof ItemController) {
                            if (target.getItemInstanceId() === data.param.id) {
                                this._itemPlacementManager.placeItem(target, data.param.placeInfo);
                            }
                            else {
                                console.error(">>>> InputAction_MoveItem : id is not matched!!!");
                            }
                        }
                    }
                }
                break;

            case "InputAction_DestroyItem":
                {
                    const item = this._owner.findItemController(data.param.id);
                    item?.dispose();
                }
                break;

            case "InputAction_RemoveFigure":
                this._itemPlacementManager.removeFigure(data.param.id, false);
                break;

            case "InputAction_MoveFigure":
                {
                    const figure = this._owner.findAvatarController(data.param.id);
                    if (figure) {
                        this._itemPlacementManager.placeFigrue(figure, data.param.placeInfo);
                    }
                }
                break;

            case "InputAction_DestroyFigure":
                {
                    const figure = this._owner.findAvatarController(data.param.id); //placementManger에서는 이미 제거 되었다.
                    figure?.dispose();
                }
                break;
            default:
                console.error(`InputHandler_PlaceMode.handleRecordingData() => not handled recording data ${data}`);
        }

    }

    //-----------------------------------------------------------------------------------
    // Pointer 이벤트 처리
    //-----------------------------------------------------------------------------------
    private _registerPointerHandlers() {
        if (this._pointerObserver) {
            return;
        }
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            this._handlePointerInfo(pointerInfo);
        });
    }

    private _unregisterPointerHanders() {
        if (this._pointerObserver) {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = null;
        }
    }

    private _handlePointerInfo(pointerInfo: BABYLON.PointerInfo) {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                this._onPointerDown(pointerInfo.pickInfo);
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                this._onPointerUp(pointerInfo.pickInfo);
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                this._onPointerMove(pointerInfo.pickInfo);
                break;
            case BABYLON.PointerEventTypes.POINTERTAP:
                this._onPointerTab(pointerInfo.pickInfo);
                break;
        }
    }

    private _onPointerDown(pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        if (pickInfo && pickInfo.hit) {
            if (pickInfo.pickedMesh) {
                const controller = this._getParentController(pickInfo.pickedMesh);
                //console.log('Select Controller ', controller);
                if (controller) {
                    const _lastPointerDownMesh = pickInfo.pickedMesh;
                    const x = this._scene.pointerX;
                    const y = this._scene.pointerY;

                    this._longPressTimer = window.setTimeout(() => {
                        // pointerX,Y가 같으면 return
                        const NO_DRAG = window.innerWidth * 0.01;
                        //console.error("NO_DRAG : ", [NO_DRAG, Math.abs(x - this._scene.pointerX), Math.abs(y - this._scene.pointerY)]);
                        if (Math.abs(x - this._scene.pointerX) > NO_DRAG || Math.abs(y - this._scene.pointerY) > NO_DRAG) return;
                        if (this._owner.isMultiTouching()) return;

                        const pickResult = this._scene.pick(
                            this._scene.pointerX,
                            this._scene.pointerY,
                            (mesh: BABYLON.AbstractMesh): boolean =>
                                <boolean>(
                                    (mesh.isPickable &&
                                        mesh.isVisible &&
                                        mesh.isReady() &&
                                        controller.isChildMesh(mesh))
                                ),
                            false,
                            this._scene.cameraToUseForPointers
                        );

                        if (pickResult?.pickedMesh) {
                            if (pickResult.pickedMesh === _lastPointerDownMesh) {
                                this._targetContext!.selectTarget(controller);
                                this._owner.getRoomContext().getCamera()!.lockControl(true);
                                if (this._targetContext!.startMovingState()) {
                                    this._processStartMoving();
                                }

                                if (MyRoomCommandRecorder.isValid()) {
                                    let isFigure = false;
                                    let id = "";
                                    if (controller instanceof AvatarController) {
                                        isFigure = true;
                                        id = controller.getAvatarId();
                                    }
                                    else if (controller instanceof ItemController) {
                                        isFigure = false;
                                        id = controller.getItemInstanceId();
                                    }

                                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_SelectTarget", param: { isFigure, id } });
                                }

                            }
                        }

                    }, InputManager.LongPressDelay);
                    return;
                }
            }
        }
    }

    private _onPointerTab(pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        this._clearLongPressTimer();

        this._owner.getRoomContext().getCamera()!.lockControl(false);
        if (pickInfo && pickInfo.hit) {
            if (pickInfo.pickedMesh) {
                const controller = this._getParentController(pickInfo.pickedMesh);
                if (controller) {
                    this._targetContext!.selectTarget(controller);
                    if (MyRoomCommandRecorder.isValid()) {
                        let isFigure = false;
                        let id = "";
                        if (controller instanceof AvatarController) {
                            isFigure = true;
                            id = controller.getAvatarId();
                        }
                        else if (controller instanceof ItemController) {
                            isFigure = false;
                            id = controller.getItemInstanceId();
                        }

                        MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_SelectTarget", param: { isFigure, id } });
                    }
                    return;
                }
            }
        }
        this._targetContext!.clearTarget();
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_ClearTarget" });
        }
    }

    private _onPointerUp(_pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        this._clearLongPressTimer();

        if (this._targetContext!.getTarget() && this._targetContext!.getTargetState() === eTargetState.Moving) {
            this._targetContext!.endMovingState();
            this._processEndMoving();
        }

        this._owner.getRoomContext().getCamera()!.lockControl(false);
    }

    private _onPointerMove(_pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        //this._checkGridPos();
        if (this._targetContext!.getTarget() && this._targetContext!.getTargetState() === eTargetState.Moving) {
            this._processMoving();
        }
    }

    private _clearLongPressTimer() {
        if (this._longPressTimer) {
            window.clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
    }

    //-----------------------------------------------------------------------------------
    // 이동 처리
    //-----------------------------------------------------------------------------------
    private _processStartMoving() {
        const target = this._targetContext!.getTarget();
        if (target) {
            if (target.parent instanceof ItemController) {
                const parentRotIdx = RoomOject.convertRotationTypeToIndex(target.parent.getPlacementRotationType());
                const targetRotIdx = RoomOject.convertRotationTypeToIndex(target.getPlacementRotationType());
                //떨어질때 더해준다
                target.setPlacementRotation(RoomOject.convertIndexToRotationType((parentRotIdx + targetRotIdx) % 8));
            }

            target.parent = null;
            if (target.getRoomObjectType() === eRoomObjectType.Item) {
                const itemController = target as ItemController;
                this._itemPlacementManager.removeItem(itemController.getItemInstanceId(), false);
                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_RemoveItem", param: { "id": itemController.getItemInstanceId() } });
                }
            }
            else if (target.getRoomObjectType() === eRoomObjectType.Figure) {
                const avatarController = target as AvatarController;
                this._itemPlacementManager.removeFigure(avatarController.getAvatarId(), false);
                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_RemoveFigure", param: { "id": avatarController.getAvatarId() } });
                }
            }
        }

        this._processMoving();
    }

    private _processMoving() {
        const target = this._targetContext!.getTarget();
        if (target) {
            //Cursor 포지션 : Touch Postion + 화면 위로 몇픽셀 위 (손가락에 가리지 않게 하기 위해)
            const cursor = this._calculateCursorPos();
            //벽에 붙는 아이템일경우 Normal에 맞추어 회전 해준다
            if (target.getPlacementAttachType() === EPlacementAttachType.Wall && cursor.grid) {
                target.aligneDir(cursor.normal.scale(-1));
            }
            //Item Pivot 포지션 : Cursor 포지션에서 아이템의 Placement 타입별로 띄워 준다 (아이템에 cursor가 가리지 않게)
            let pivotPos = this._calculateMovingTargetPivotPos(cursor.pos, cursor.normal, cursor.grid, target);
            pivotPos = this._clampMovingTargetPivotPosition(target, pivotPos);
            target.setAbsolutePosition(pivotPos);
            //DisplayGrid 갱신
            this._updateDiplayGrid();
        }
    }

    private _processEndMoving() {
        const target = this._targetContext!.getTarget();
        if (target) {
            if (target.getRoomObjectType() === eRoomObjectType.Item) {
                this._moveItem(target);
            }
            else if (target.getRoomObjectType() === eRoomObjectType.Figure) {
                this._moveFigure(target);
            }
        }

        this._gridDisplayer.update(null, false, 0, 0, 0, 0);
    }

    private _updateDiplayGrid() {
        const target = this._targetContext!.getTarget();
        if (target) {
            const result = this._checkGridArea(target, target.getPlacementRotationType());
            if (result.hitGrid) {
                this._gridDisplayer.update(result.hitGrid, result.isValidArea, result.areaFromX, result.areaToX, result.areaFromY, result.areaToY);
                this._targetContext!.updateDraggingState(result.isValidArea);
                return;
            }
            else {
                this._targetContext!.updateDraggingState(false);
            }
        }

        this._gridDisplayer.update(null, false, 0, 0, 0, 0);
    }

    private _calculateCursorPos(): { pos: BABYLON.Vector3, normal: BABYLON.Vector3; grid: Grid | null; } {
        const screenPosX = this._scene.pointerX;
        const screenPosY = Math.max(0, this._scene.pointerY - Constants.ROOMOBJECT_CURSOR_SCREEN_SPACE_DIFF);
        const target = this._targetContext!.getTarget();
        const result = this._itemPlacementManager.pick(screenPosX, screenPosY, this._targetContext!.getTargetPlacementTypes());
        if (result.hitGrid) {
            const placementWidth = target!.getPlacementWidth();
            const placementHeight = target!.getPlacementHeight();
            const cellArea = this._calculateArea(result.hitCellPosX, result.hitCellPosY, placementWidth, placementHeight, target!.getPlacementRotationType());

            const oPos = new BABYLON.Vector3();
            result.hitGrid.calculateAbsolutePostion(cellArea.fromX, cellArea.toX, cellArea.fromY, cellArea.toY, oPos);


            let normal: BABYLON.Vector3 = BABYLON.Vector3.Zero();
            if (result.hitGrid) {
                if (result.hitGrid.getGridNormal() === eGridNormal.X) {
                    normal = BABYLON.Vector3.Left();
                }
                else if (result.hitGrid.getGridNormal() === eGridNormal.Z) {
                    normal = BABYLON.Vector3.Forward();
                }
                else {
                    normal = BABYLON.Vector3.Up();
                }
            }

            //BABYLON.RayHelper.CreateAndShow(new BABYLON.Ray(oPos, normal), this._scene, BABYLON.Color3.Green());
            return { pos: oPos, normal: normal, grid: result.hitGrid };
        }

        return this._pickWithPickingGuardWall(screenPosX, screenPosY);
    }


    private _calculateMovingTargetPivotPos(cursorPos: BABYLON.Vector3, cursorHitNormal: BABYLON.Vector3, hitGrid: Grid | null, target: RoomOject): BABYLON.Vector3 {
        let pivotPos: BABYLON.Vector3 = new BABYLON.Vector3();
        if (target.getPlacementAttachType() === EPlacementAttachType.Wall) {
            pivotPos = cursorPos;
            //그리드가 없을경우 바닥 GaurdWall과 충돌해서 위로 올라오는 증상 막음
            if (hitGrid) {
                pivotPos = cursorPos.add(cursorHitNormal.normalizeToNew().scale(Constants.ROOMOBJECT_PIVOIT_FROM_CURSOR_METER));
            }
        }
        else {
            pivotPos = cursorPos.add(BABYLON.Vector3.Up().scale(Constants.ROOMOBJECT_PIVOIT_FROM_CURSOR_METER));
        }

        return pivotPos;
    }

    private _clampMovingTargetPivotPosition(target: RoomOject, pivotPos: BABYLON.Vector3): BABYLON.Vector3 {

        //포인터가 위치한 곳에 Object에 Pivot을 맞추면 매쉬가 씹힐수 있다 그래서 메쉬의 크기만큼 보정해 준다
        let oPos: BABYLON.Vector3 = new BABYLON.Vector3();
        oPos.copyFrom(pivotPos);

        let freeAxis: eFreeAxisType = eFreeAxisType.None;

        if (target.getPlacementAttachType() !== EPlacementAttachType.Wall) {
            freeAxis = eFreeAxisType.YFree;
        }
        else if (target.forward.z > 0.9) {
            freeAxis = eFreeAxisType.ZFree;
        }
        else if (target.forward.x < -0.9) {
            freeAxis = eFreeAxisType.XFree;
        }

        //Right Wall에 붙을경우
        if (eFreeAxisType.XFree === freeAxis) {
            if (oPos.y < target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                oPos.y = target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
            }

            if (oPos.z < target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                oPos.z = target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
            }
        }
        //Floor에 배치 될경우
        else if (eFreeAxisType.YFree === freeAxis) {
            //회전에 따라서 바뀌어야 한다!!
            if (target.getPlacementRotationType() === ePlacementRotationType.Rot_0 || target.getPlacementRotationType() === ePlacementRotationType.Rot_180) {
                if (oPos.x > -target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                    oPos.x = -target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
                }

                if (oPos.z < target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                    oPos.z = target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
                }
            }
            else {
                if (oPos.x > -target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                    oPos.x = -target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
                }

                if (oPos.z < target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                    oPos.z = target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
                }
            }
        }
        //Left Wall에 붙을경우
        else if (eFreeAxisType.ZFree === freeAxis) {
            if (oPos.x > -target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                oPos.x = -target.getPlacementWidth() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
            }

            if (oPos.y < target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5) {
                oPos.y = target.getPlacementHeight() * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
            }
        }

        //벽에 붙는 아이템이 경우 x 나 z 값이 고정된다. (본디 참조)
        if (target.getPlacementAttachType() === EPlacementAttachType.Wall) {
            if (target.forward.z > 0.9) {
                oPos.z = Constants.ROOMOBJECT_PIVOIT_FROM_CURSOR_METER;
            }
            else if (target.forward.x < -0.9) {
                oPos.x = -Constants.ROOMOBJECT_PIVOIT_FROM_CURSOR_METER;
            }
        }

        return oPos;
    }

    private _checkGridArea(target: RoomOject | null, rot: ePlacementRotationType): ICheckGridAreaResult {
        const areaResult: ICheckGridAreaResult = {
            hitGrid: null,
            hitPos: BABYLON.Vector3.Zero(),
            hitCellPosX: 0,
            hitCellPosY: 0,
            isValidArea: false,
            areaFromX: 0,
            areaToX: 0,
            areaFromY: 0,
            areaToY: 0
        };

        if (target) {
            const ray = target.createGridPickRay();
            const pickResult = this._itemPlacementManager.pickGrid(ray, this._targetContext!.getTargetPlacementTypes());

            areaResult.hitGrid = pickResult.hitGrid;
            areaResult.hitPos = pickResult.hitPos;
            areaResult.hitCellPosX = pickResult.hitCellPosX;
            areaResult.hitCellPosY = pickResult.hitCellPosY;

            const area = this._calculateArea(pickResult.hitCellPosX, pickResult.hitCellPosY, target.getPlacementWidth(), target.getPlacementHeight(), rot);
            areaResult.areaFromX = area.fromX;
            areaResult.areaToX = area.toX;
            areaResult.areaFromY = area.fromY;
            areaResult.areaToY = area.toY;

            if (pickResult.hitGrid) {
                areaResult.isValidArea = pickResult.hitGrid.isEmptyArea(area.fromX, area.toX, area.fromY, area.toY);
            }
        }

        return areaResult;
    }


    //@ts-ignore
    private _checkGridPos() {
        const hitResult = this._itemPlacementManager.pick(this._scene.pointerX, this._scene.pointerY, [EPlacementAttachType.Wall]);
        if (hitResult.hitGrid) {
            const indicaterArea = this._calculateArea(hitResult.hitCellPosX, hitResult.hitCellPosY, 2, 2, ePlacementRotationType.Rot_0);
            this._gridDisplayer.update(hitResult.hitGrid, true, indicaterArea.fromX, indicaterArea.fromX, indicaterArea.fromY, indicaterArea.fromY);
            return;
        }
    }

    //-----------------------------------------------------------------------------------
    // move item
    //-----------------------------------------------------------------------------------
    private _moveItem(target: RoomOject | null) {
        if (target) {
            const itemController = target as ItemController;
            const areaResult = this._checkGridArea(target, target.getPlacementRotationType());
            //배치 할수 있는 곳이면 그곳에 배치한다.
            if (areaResult.hitGrid && areaResult.isValidArea) {

                const pId = this._getParentIdByGridName(areaResult.hitGrid.getName());
                const area = this._calculateArea(areaResult.hitCellPosX, areaResult.hitCellPosY, target.getPlacementWidth(), target.getPlacementHeight(), target.getPlacementRotationType());
                const placeInfo: IMyRoomItemPlacementInfo = this._makeItemPlacementInfo(itemController.getItemId(), itemController.getItemInstanceId(), pId, areaResult.hitGrid.getName(),
                    area.fromX, area.toX, area.fromY, area.toY, itemController.getPlacementRotationType(), this._getParentRotTypeByParentItemInstanceId(pId));
                this._itemPlacementManager.placeItem(itemController, placeInfo);

                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveItem", param: { "id": itemController.getItemInstanceId(), placeInfo } });
                }
            }
            //배치 할수 없는 곳이면 근처에 배치 가능한 곳을 찿아서 배치한다.
            else if (areaResult.hitGrid && !areaResult.isValidArea) {
                const ray = target.createGridPickRay();
                const bestResult = this._itemPlacementManager.findBestPostion(ray, this._targetContext!.getTargetPlacementTypes(), target.getPlacementWidth(), target.getPlacementHeight());
                if (bestResult.success) {
                    const pId = this._getParentIdByGridName(bestResult.grid!.getName());
                    const placeInfo: IMyRoomItemPlacementInfo = this._makeItemPlacementInfo(itemController.getItemId(), itemController.getItemInstanceId(), pId, bestResult.grid!.getName(),
                        bestResult.fromX, bestResult.toX, bestResult.fromY, bestResult.toY, itemController.getPlacementRotationType(), this._getParentRotTypeByParentItemInstanceId(pId));
                    this._itemPlacementManager.placeItem(itemController, placeInfo);

                    if (MyRoomCommandRecorder.isValid()) {
                        MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveItem", param: { "id": itemController.getItemInstanceId(), placeInfo } });
                    }
                }
                else {
                    const backup = this._targetContext!.getBackupPlacementInfo();
                    if (backup) {
                        const pId = this._getParentIdByGridName(backup?.gridName);
                        const placeInfo: IMyRoomItemPlacementInfo = this._makeItemPlacementInfo(itemController.getItemId(), itemController.getItemInstanceId(), pId, areaResult.hitGrid.getName(),
                            backup.fromX, backup.toX, backup.fromY, backup.toY, itemController.getPlacementRotationType());
                        this._itemPlacementManager.placeItem(itemController, placeInfo);

                        if (MyRoomCommandRecorder.isValid()) {
                            MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveItem", param: { "id": itemController.getItemInstanceId(), placeInfo } });
                        }
                    }
                }
            }
            //아에 영역을 벗어났으면 제거한다.
            else {

                //재귀적으로 child 부터 제거하자. //==> 선반위에 선반 테스트 해봐야한다!!!!
                const allChildItems = itemController?.getAllChildItemsForDelete();
                if (allChildItems) {
                    for (let cc = allChildItems.length - 1; cc >= 0; --cc) {
                        this._itemPlacementManager.removeItem(allChildItems[cc].getItemInstanceId(), true);
                    }
                }

                //figure 제거
                const allChildFigures = itemController?.getAllChildFiguresForDelete();
                if (allChildFigures) {
                    for (let cc = allChildFigures.length - 1; cc >= 0; --cc) {
                        this._itemPlacementManager.removeFigure(allChildFigures[cc].getAvatarId(), true);
                    }
                }

                //이미 제거된 아이템이라서 그리드 제거하고 dispose 시킨다!!
                this._itemPlacementManager.removeGrid(itemController.getItemInstanceId()); //grid가 있으면 그리드를 제거하자
                this._targetContext!.clearTarget();
                this._itemPlacementManager.deleted(itemController);
                itemController.dispose();

                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_DestroyItem", param: { "id": itemController.getItemInstanceId() } });
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_ClearTarget" });
                }
            }
        }
    }
    //-----------------------------------------------------------------------------------
    // move Figure
    //-----------------------------------------------------------------------------------
    private _moveFigure(target: RoomOject | null) {
        if (target) {
            const avatarController = target as AvatarController;
            const areaResult = this._checkGridArea(target, target.getPlacementRotationType());
            //배치 할수 있는 곳이면 그곳에 배치한다.
            if (areaResult.hitGrid && areaResult.isValidArea) {
                const pId = this._getParentIdByGridName(areaResult.hitGrid.getName());
                const area = this._calculateArea(areaResult.hitCellPosX, areaResult.hitCellPosY, target.getPlacementWidth(), target.getPlacementHeight(), target.getPlacementRotationType());
                const placeInfo: IMyRoomFigurePlacementInfo = this._makeFigurePlacementInfo(!avatarController.isFigure(), avatarController.getAvatarId(), pId, areaResult.hitGrid.getName(),
                    area.fromX, area.toX, area.fromY, area.toY, avatarController.getPlacementRotationType(), this._getParentRotTypeByParentItemInstanceId(pId));
                this._itemPlacementManager.placeFigrue(avatarController, placeInfo);

                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveFigure", param: { "id": avatarController.getAvatarId(), placeInfo } });
                }
            }
            //배치 할수 없는 곳이면 근처에 배치 가능한 곳을 찿아서 배치한다.
            else if (areaResult.hitGrid && !areaResult.isValidArea) {
                const ray = target.createGridPickRay();
                const bestResult = this._itemPlacementManager.findBestPostion(ray, this._targetContext!.getTargetPlacementTypes(), target.getPlacementWidth(), target.getPlacementHeight());
                if (bestResult.success) {
                    const pId = this._getParentIdByGridName(bestResult.grid!.getName());
                    const placeInfo: IMyRoomFigurePlacementInfo = this._makeFigurePlacementInfo(!avatarController.isFigure(), avatarController.getAvatarId(), pId, bestResult.grid!.getName(),
                        bestResult.fromX, bestResult.toX, bestResult.fromY, bestResult.toY, avatarController.getPlacementRotationType(), this._getParentRotTypeByParentItemInstanceId(pId));
                    this._itemPlacementManager.placeFigrue(avatarController, placeInfo);

                    if (MyRoomCommandRecorder.isValid()) {
                        MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveFigure", param: { "id": avatarController.getAvatarId(), placeInfo } });
                    }
                }
                else {
                    const backup = this._targetContext!.getBackupPlacementInfo();
                    if (backup) {
                        const pId = this._getParentIdByGridName(backup?.gridName);
                        const placeInfo: IMyRoomFigurePlacementInfo = this._makeFigurePlacementInfo(!avatarController.isFigure(), avatarController.getAvatarId(), pId, backup.gridName,
                            backup.fromX, backup.toX, backup.fromY, backup.toY, avatarController.getPlacementRotationType());
                        this._itemPlacementManager.placeFigrue(avatarController, placeInfo);

                        if (MyRoomCommandRecorder.isValid()) {
                            MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveFigure", param: { "id": avatarController.getAvatarId(), placeInfo } });
                        }
                    }
                }
            }
            //아에 영역을 벗어났으면 제거한다.
            else {
                if (!avatarController.isFigure()) {
                    console.log("아바타는 제거할수 없습니다.");
                    const backup = this._targetContext!.getBackupPlacementInfo();
                    if (backup) {
                        const pId = this._getParentIdByGridName(backup?.gridName);
                        const placeInfo: IMyRoomFigurePlacementInfo = this._makeFigurePlacementInfo(!avatarController.isFigure(), pId, avatarController.getAvatarId(), backup.gridName,
                            backup.fromX, backup.toX, backup.fromY, backup.toY, avatarController.getPlacementRotationType());
                        this._itemPlacementManager.placeFigrue(avatarController, placeInfo);

                        if (MyRoomCommandRecorder.isValid()) {
                            MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_MoveFigure", param: { "id": avatarController.getAvatarId(), placeInfo } });
                        }
                    }
                    return;
                }

                this._targetContext!.clearTarget();
                avatarController.dispose();

                if (MyRoomCommandRecorder.isValid()) {
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_DestroyFigure", param: { "id": avatarController.getAvatarId() } });
                    MyRoomCommandRecorder.getInstance().addCommand_InputAction({ commandName: "InputAction_ClearTarget" });
                }
            }
        }
    }




    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------
    private _getParentController(node: BABYLON.Node): BABYLON.Nullable<ItemController | AvatarController> {
        if (!node.parent) {
            return null;
        }

        if (node.parent instanceof AvatarController) {
            if (node.parent.isOutside())
                return null;
            return node.parent;
        }
        if (node.parent instanceof ItemController) {
            return node.parent;
        }

        return this._getParentController(node.parent);
    }

    private _createPickingGuardWall(): BABYLON.TransformNode {
        const GUARD_WALL_SIZE: number = 100;
        const pos = GUARD_WALL_SIZE * 0.5;

        const pickingGuardWallRoot = new BABYLON.TransformNode("[Picking Guard Walls]", this._scene);
        pickingGuardWallRoot.parent = this._owner;
        this._pickingGuardWallTop = pickingGuardWallRoot;

        const ground = BABYLON.MeshBuilder.CreateGround("Ground", { width: GUARD_WALL_SIZE, height: GUARD_WALL_SIZE }, this._scene);
        ground.parent = pickingGuardWallRoot;
        ground.setAbsolutePosition(new BABYLON.Vector3(-pos, 0, pos));
        ground.visibility = 0.0;

        const leftWall = BABYLON.MeshBuilder.CreatePlane("Left Wall", { width: GUARD_WALL_SIZE, height: GUARD_WALL_SIZE }, this._scene);
        leftWall.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(90), 0);
        leftWall.parent = pickingGuardWallRoot;
        leftWall.setAbsolutePosition(new BABYLON.Vector3(0, pos, pos));
        leftWall.visibility = 0.0;

        const rightWall = BABYLON.MeshBuilder.CreatePlane("Right Wall", { width: GUARD_WALL_SIZE, height: GUARD_WALL_SIZE }, this._scene);
        rightWall.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(180), 0);
        rightWall.parent = pickingGuardWallRoot;
        rightWall.setAbsolutePosition(new BABYLON.Vector3(-pos, pos, 0));
        rightWall.visibility = 0.0;

        this._pickingGuardWallMeshes.push(ground);
        this._pickingGuardWallMeshes.push(leftWall);
        this._pickingGuardWallMeshes.push(rightWall);

        return pickingGuardWallRoot;
    }

    private _pickWithPickingGuardWall(x: number, y: number): { pos: BABYLON.Vector3, normal: BABYLON.Vector3; grid: Grid | null; } {
        const ray = this._scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), null);
        const hitResult = ray.intersectsMeshes(this._pickingGuardWallMeshes);
        if (hitResult.length > 0 && hitResult[0].hit) {
            return { pos: hitResult[0].pickedPoint!, normal: hitResult[0]!.getNormal()!, grid: null };
        }

        console.error("ItemMoveHandler._pickWithPickingGauardWall() => check!!!!"); //카메라가 풀리기 전에는 나올 수 없다!!!
        return { pos: new BABYLON.Vector3(0, -10000, 0), normal: BABYLON.Vector3.Up(), grid: null };
    }

    private _calculateArea(cellPosX: number, cellPosY: number, w: number, h: number, rot: ePlacementRotationType): { fromX: number, toX: number, fromY: number, toY: number; } {
        let fromX = cellPosX - (w / 2) + 1;
        let toX = cellPosX + (w / 2);
        let fromY = cellPosY - (h / 2) + 1;
        let toY = cellPosY + (h / 2);

        if (rot === ePlacementRotationType.Rot_90 || rot === ePlacementRotationType.Rot_270) {
            fromX = cellPosX - (h / 2) + 1;
            toX = cellPosX + (h / 2);
            fromY = cellPosY - (w / 2) + 1;
            toY = cellPosY + (w / 2);
        }

        return { fromX, toX, fromY, toY };
    }

    private _getParentIdByGridName(gridName: string): string {
        let parentItemInstanceId = gridName;

        //책상이 더이상 1개의 그리드를 가지고있지 않는다. 기획팀 요청으로 여러개를 갖을수 있다..
        //책상의 GridName은 xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx[3] 형태로 끝에 [grid index]를 추가한다 => 기존의 데이터를 유지하기위해 첫번째 그리드는 [grid index]를 추가하지 않는다.
        const l = gridName.length;
        if (gridName[l - 1] === "]" && gridName[l - 3] === "[") {
            parentItemInstanceId = gridName.substring(0, l - 3);
        }

        let pId = "";
        if (this._itemPlacementManager.getItemPlacementInfo(parentItemInstanceId)) {
            pId = parentItemInstanceId;
        }
        return pId;
    }

    private _getParentRotTypeByParentItemInstanceId(parentItemInstanceId: string): ePlacementRotationType {
        const parentItem = this._itemPlacementManager.getPlacedItemController(parentItemInstanceId);
        if (parentItem) {
            return parentItem.getPlacementRotationType();
        }

        return ePlacementRotationType.Rot_0;
    }

    private _makeItemPlacementInfo(itemId: string, instanceId: string, parentId: string, gridName: string, fromX: number, toX: number, fromY: number, toY: number, rot: ePlacementRotationType, parentRot: ePlacementRotationType = ePlacementRotationType.Rot_0): IMyRoomItemPlacementInfo {
        //이동처리시 부모의 회전에 따라 나의 회전값을 변경해야한다. 적당한 코드위치 찾을것!!!
        const rotParentIdx = RoomOject.convertRotationTypeToIndex(parentRot);
        const rotChildIdx = RoomOject.convertRotationTypeToIndex(rot);
        const calculateRot = RoomOject.convertIndexToRotationType((rotChildIdx + 8 - rotParentIdx) % 8);

        return {
            itemId,
            instanceId,
            parentId,
            placeInfo: {
                gridName: gridName,
                fromX: fromX,
                toX: toX,
                fromY: fromY,
                toY: toY,
                rot: calculateRot
            }
        };

    }

    private _makeFigurePlacementInfo(isAvatar: boolean, avatarId: string, parentId: string, gridName: string, fromX: number, toX: number, fromY: number, toY: number, rot: ePlacementRotationType, parentRot: ePlacementRotationType = ePlacementRotationType.Rot_0): IMyRoomFigurePlacementInfo {
        //이동처리시 부모의 회전에 따라 나의 회전값을 변경해야한다. 적당한 코드위치 찾을것!!!
        const rotParentIdx = RoomOject.convertRotationTypeToIndex(parentRot);
        const rotChildIdx = RoomOject.convertRotationTypeToIndex(rot);
        const calculateRot = RoomOject.convertIndexToRotationType((rotChildIdx + 8 - rotParentIdx) % 8);

        return {
            avatarId,
            isAvatar,
            parentId,
            placeInfo: {
                gridName: gridName,
                fromX: fromX,
                toX: toX,
                fromY: fromY,
                toY: toY,
                rot: calculateRot
            }
        };

    }

    private _getNextRotationType_Item(curRot: ePlacementRotationType, isSquare?: boolean): ePlacementRotationType {
        if (isSquare) {
            const rotIdx = RoomOject.convertRotationTypeToIndex(curRot);
            return RoomOject.convertIndexToRotationType((rotIdx + 1) % 8);
        } else {
            const next: ePlacementRotationType = ((curRot + 1) % 4);
            return next;
        }
    }

    private _getNextRotationType_Figure(curRot: ePlacementRotationType): ePlacementRotationType {
        const rotIdx = RoomOject.convertRotationTypeToIndex(curRot);
        return RoomOject.convertIndexToRotationType((rotIdx + 1) % 8);
    }
}

//---------------------------------------------------------------------------------------
// Internal Classes
//---------------------------------------------------------------------------------------
enum eFreeAxisType {
    None,
    XFree,
    YFree,
    ZFree,
}

enum eTargetState {
    None,
    Selected,
    Moving,
}

class TargetContext {
    private _scene: BABYLON.Scene;
    private _target: RoomOject | null = null;
    private _itemPlacementManager: ItemPlacementManager;
    private _targetState: eTargetState = eTargetState.None;
    private _highlightLayer: BABYLON.HighlightLayer;
    private _targetPlacementTypes: EPlacementAttachType[] = [];
    private _backupPlacementInfo: IMyRoomPlacementInfo | undefined = undefined;

    public onSelectionChanged: BABYLON.Observable<SelectionInfo> = new BABYLON.Observable<SelectionInfo>();
    public onDragChanged: BABYLON.Observable<DragInfo> = new BABYLON.Observable<DragInfo>();

    public getTarget(): RoomOject | null {
        return this._target;
    }

    public getTargetState(): eTargetState {
        return this._targetState;
    }

    public getTargetPlacementTypes(): EPlacementAttachType[] {
        return this._targetPlacementTypes;
    }

    public getBackupPlacementInfo(): IMyRoomPlacementInfo | undefined {
        return this._backupPlacementInfo;
    }

    constructor(scene: BABYLON.Scene, itemPlacementManager: ItemPlacementManager) {
        this._scene = scene;
        this._itemPlacementManager = itemPlacementManager;

        this._highlightLayer = new MyHighlightLayer("highlight layer", this._scene, { mainTextureRatio: 1.0, isStroke: true, blurTextureSizeRatio: 1.5 });
        this._highlightLayer.mainTexture.renderList = [];
    }

    public dispose() {
        this._highlightLayer.dispose();
    }

    public selectTarget(target: RoomOject) {
        //console.log('SelectTArget ', target);
        if (target === this._target) {
            return;
        }

        this.clearTarget(true);

        this._target = target;

        if (this._target) {
            this._targetState = eTargetState.Selected;

            this._changeTargetHightlightColor(BABYLON.Color3.Yellow());

            const placementType = this._getTargetPlacementType();
            this._targetPlacementTypes = [];
            this._targetPlacementTypes.push(placementType);
            if (placementType === EPlacementAttachType.Desk) {
                this._targetPlacementTypes.push(EPlacementAttachType.Floor);
            }
        }
        else {
            this._targetState = eTargetState.None;
        }

        if (this._target instanceof ItemController) {
            this.onSelectionChanged.notifyObservers(new SelectionInfo(false, this._target.getItemInstanceId(), this._target.getItemId(), false));
        }
        else if (this._target instanceof AvatarController) {
            this.onSelectionChanged.notifyObservers(new SelectionInfo(true, this._target.getAvatarId(), "", this._target.isOutside()));
        }

    }

    public clearTarget(ignoreNotify: boolean = false) {
        if (this._target) {
            this._target = null;
            this._targetState = eTargetState.None;
            this._highlightLayer.removeAllMeshes();
            if (this._highlightLayer.mainTexture.renderList) this._highlightLayer.mainTexture.renderList.length = 0;
            this._targetPlacementTypes = [];
            this._backupPlacementInfo = undefined;
        }

        if (!ignoreNotify) {
            this.onSelectionChanged.notifyObservers(new SelectionInfo(false, "", "", false));
        }
    }

    public startMovingState(): boolean {
        if (this._target && this._targetState === eTargetState.Selected) {
            this._targetState = eTargetState.Moving;
            this._backupCurrentPlacementInfo();
            this._changeTargetHightlightColor(BABYLON.Color3.Green());
            //this._lockCamera(true);

            if (this._target instanceof ItemController) {
                this.onDragChanged.notifyObservers(new DragInfo(false, this._target.getItemInstanceId(), this._target.getItemId(), true));
            }
            else if (this._target instanceof AvatarController) {
                this.onDragChanged.notifyObservers(new DragInfo(true, this._target.getAvatarId(), "", true));
            }

            return true;
        }

        return false;
    }

    public endMovingState() {
        if (this._target && this._targetState === eTargetState.Moving) {
            this._targetState = eTargetState.Selected;
            this._changeTargetHightlightColor(BABYLON.Color3.Yellow());
            //this._lockCamera(false);

            this.onDragChanged.notifyObservers(new DragInfo(false, "", "", false));
        }
    }

    public updateDraggingState(inValildArea: boolean) {
        this._changeTargetHightlightColor(inValildArea ? BABYLON.Color3.Green() : BABYLON.Color3.Red());
    }

    private _changeTargetHightlightColor(color: BABYLON.Color3) {
        if (this._target) {
            this._highlightLayer.removeAllMeshes();
            if (this._highlightLayer.mainTexture.renderList) this._highlightLayer.mainTexture.renderList.length = 0;
            const map = new Map<number, boolean>();
            this._target.getChildMeshes().forEach((mesh) => {
                if (mesh instanceof BABYLON.Mesh) {
                    this._highlightLayer.addMesh(mesh as BABYLON.Mesh, color);
                    this._highlightLayer.mainTexture.renderList?.push(mesh);
                    map.set(mesh.uniqueId, true);
                    this._highlightLayer.removeExcludedMesh(mesh);
                }
            });

            // 나머지 mesh들을 제외해야 선택된 물체의 외곽선만 정확히 보인다.
            this._scene.meshes.forEach((mesh) => {
                if (mesh instanceof BABYLON.Mesh && !map.has(mesh.uniqueId)) {
                    this._highlightLayer.addExcludedMesh(mesh);
                }
            });
        }
    }

    private _getTargetPlacementType(): EPlacementAttachType {
        if (this._target instanceof ItemController) {
            const tableData = TableDataManager.getInstance().findItem(this._target.getItemId());
            if (tableData) {
                return tableData.placement_attach_type;
            }
            else {
                console.error("TargetContext._getTargetPlacementType() => no table data");
            }
        }
        else if (this._target instanceof AvatarController) {
            return this._target.getPlacementAttachType();
        }

        return EPlacementAttachType.Floor;
    }

    private _backupCurrentPlacementInfo() {
        if (this._target instanceof ItemController) {
            this._backupPlacementInfo = this._itemPlacementManager.getItemPlacementInfo(this._target.getItemInstanceId());
        }
        else if (this._target instanceof AvatarController) {
            this._backupPlacementInfo = this._itemPlacementManager.getFigurePlacementInfo(this._target.getAvatarId());
        }
    }
}


