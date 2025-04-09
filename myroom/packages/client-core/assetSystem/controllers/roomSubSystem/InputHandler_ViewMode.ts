import * as BABYLON from "@babylonjs/core";
import { MyRoomController } from "../myRoomController";
import { ItemController } from "../itemController";
import { AvatarController } from "../avatarController";
import { RoomOject } from "./roomObject";
import { SelectionInfo } from "./InputHandler_PlaceMode";
import { ConstantsEx } from "../../../assetSystem/constantsEx";


export class InputHandler_ViewMode {
    //@ts-ignore
    private _owner: MyRoomController;
    private _scene: BABYLON.Scene;

    private _isHandlerEnabled: boolean = false;
    private _pointerObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>> = null;
    private _currentTarget: BABYLON.Nullable<RoomOject> = null;

    public onSelectionChanged: BABYLON.Observable<SelectionInfo> = new BABYLON.Observable<SelectionInfo>();

    public constructor(owner: MyRoomController, scene: BABYLON.Scene) {
        this._owner = owner;
        this._scene = scene;

        this._currentTarget = null;
    }

    public finalize() {
        this.enableHandler(false);
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
            this._currentTarget = null;
            this._unregisterPointerHanders();
        }
    }

    public addCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this.onSelectionChanged.add(callback);

    }

    public removeCallbackSelectionChanged(callback: (info: SelectionInfo) => void) {
        this.onSelectionChanged.removeCallback(callback);
    }

    public deselectTarget() {
        this._selectTarget(null);
    }


    //-----------------------------------------------------------------------------------
    // Pointer 이벤트 처리
    //-----------------------------------------------------------------------------------
    private _registerPointerHandlers() {
        if (this._pointerObserver) {
            return;
        }
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    // pc에서만 작동한다.
                    if (!ConstantsEx.isMobile()) this._onPointerMove(pointerInfo.pickInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERTAP:
                    this._onPointerTab(pointerInfo.pickInfo);
                    break;
            }
        });
    }

    private _unregisterPointerHanders() {
        if (this._pointerObserver) {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = null;
        }
    }

    private _onPointerMove(pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        const pickResult = this._scene.pick(
            this._scene.pointerX,
            this._scene.pointerY
        );
        if (pickResult.pickedMesh) {
            const controller = this._getParentController(pickResult.pickedMesh);
            if (controller
                && (
                    (controller instanceof ItemController && controller.hasFunction()) ||
                    (controller instanceof AvatarController)
                )) {
                const canvas = this._scene.getEngine().getInputElement();
                if (canvas) canvas.style.cursor = this._scene.hoverCursor;
            }
        }
    }

    private _onPointerTab(pickInfo: BABYLON.Nullable<BABYLON.PickingInfo>) {
        if (pickInfo && pickInfo.hit) {
            if (pickInfo.pickedMesh) {
                const controller = this._getParentController(pickInfo.pickedMesh);
                if (controller) {
                    this._selectTarget(controller);
                    controller.onTouch();
                    return;
                }
            }
        }

        this._selectTarget(null);
    }

    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------
    private _getParentController(node: BABYLON.Node): BABYLON.Nullable<ItemController | AvatarController> {
        if (!node.parent) {
            return null;
        }

        if (node.parent instanceof ItemController || node.parent instanceof AvatarController) {
            return node.parent;
        }

        return this._getParentController(node.parent);
    }

    private _selectTarget(target: RoomOject | null) {
        // 웹에서 선택하면, 항상 보내달라고 하여, 비교문 주석처리함. (by ulralra 20230825)
        //if (this._currentTarget !== target) {
        this._currentTarget = target;

        if (this._currentTarget instanceof ItemController) {
            this.onSelectionChanged.notifyObservers(new SelectionInfo(false, this._currentTarget.getItemInstanceId(), this._currentTarget.getItemId(), false));
        }
        else if (this._currentTarget instanceof AvatarController) {
            this.onSelectionChanged.notifyObservers(new SelectionInfo(true, this._currentTarget.getAvatarId(), "", this._currentTarget.isOutside()));
        }

        return;

        //}

        //this.onSelectionChanged.notifyObservers(new SelectionInfo(false, "", ""));
    }
}




