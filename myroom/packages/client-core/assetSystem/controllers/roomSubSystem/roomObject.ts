import * as BABYLON from "@babylonjs/core";
import { eRoomObjectType, ePlacementRotationType } from "../../definitions";
import { EPlacementAttachType } from "../../../tableData/defines/System_Enum";
import { MyRoomController } from "../myRoomController";
import { MyRoomContext } from "../../myRoomContext";
import { ItemController } from "../itemController";

export interface IRooObjectGridInfo {
    gridSizeWidth: number;
    gridSizeHeight: number;
    gridOrigin: BABYLON.Vector3;
    gridMarkArray: number[];
}

export class RoomOject extends BABYLON.TransformNode {
    protected _context: MyRoomContext;
    protected _ownerRoom: MyRoomController | null = null; //룸에 배치된 아이템일 경우 설정된다.
    protected _roomObjectType: eRoomObjectType;
    protected _placementWidth: number = 0;
    protected _placementHeight: number = 0;
    protected _placementRot: ePlacementRotationType = ePlacementRotationType.Rot_0;
    protected _placementAttachType: EPlacementAttachType = EPlacementAttachType.Floor;
    protected _gridInfos: IRooObjectGridInfo[] = [];

    private _cachedGridRay: BABYLON.Ray | null = null;
    private _canvasPositionEventHandler_Top: ((canvasPos: BABYLON.Vector3) => void) | null = null;
    private _canvasPositionEventHandler_Bottom: ((canvasPos: BABYLON.Vector3) => void) | null = null;
    //@ts-ignore
    private _canvasPosttionOffset_Top: BABYLON.Vector3 | null = null;
    private _canvasPosttionOffset_Bottom: BABYLON.Vector3 | null = null;
    private _canvasPositionEvnetObserver_Top: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    private _canvasPositionEvnetObserver_Bottom: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;

    public getRoomContext(): MyRoomContext {
        return this._context;
    }

    public getOwnerRoom(): MyRoomController | null {
        return this._ownerRoom;
    }

    public getRoomObjectType(): eRoomObjectType {
        return this._roomObjectType;
    }

    public getPlacementWidth(): number {
        return this._placementWidth;
    }

    public getPlacementHeight(): number {
        return this._placementHeight;
    }

    public getPlacementAttachType(): EPlacementAttachType {
        return this._placementAttachType;
    }

    public getPlacementRotationType(): ePlacementRotationType {
        return this._placementRot;
    }

    public hasGrid(): boolean {
        return this._gridInfos.length > 0;
    }

    public getGridInfos(): IRooObjectGridInfo[] {
        return this._gridInfos;
    }

    public addGridInfo(gridInfo: IRooObjectGridInfo) {
        this._gridInfos.push(gridInfo);
    }

    public getBoundingInfo(ignoreStatusObject: boolean = true): BABYLON.BoundingInfo {
        // 높은 곳에 설치된 아이템의 경우 때문에, 상대좌표로 처리해야 함.
        //const boundingInfo = new BABYLON.BoundingInfo(this.getAbsolutePosition().add(new BABYLON.Vector3(-0.01, -0.01, -0.01)), this.getAbsolutePosition().add(new BABYLON.Vector3(0.01, 0.01, 0.01)));
        let boundingInfo: BABYLON.BoundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-0.01, -0.01, -0.01), new BABYLON.Vector3(0.01, 0.01, 0.01), this.worldMatrixFromCache);
        this.getChildMeshes().forEach((m) => {
            if (!m.isEnabled() || (ignoreStatusObject && m.name.startsWith("STATUS_OBJ"))) return;
            boundingInfo.encapsulateBoundingInfo(m.getBoundingInfo());
        });
        return boundingInfo;
    }



    public constructor(context: MyRoomContext, ownerRoom: MyRoomController | null, roomObjectType: eRoomObjectType, name: string, scene: BABYLON.Nullable<BABYLON.Scene>) {
        super(name, scene);
        this._ownerRoom = ownerRoom;
        this._context = context;
        this._roomObjectType = roomObjectType;
    }

    public createGridPickRay(): BABYLON.Ray {
        if (this._cachedGridRay === null) {
            this._cachedGridRay = new BABYLON.Ray(new BABYLON.Vector3(0, 0, 0), BABYLON.Vector3.Down());
        }

        //grid 경계에 있을경우 floating 오차로 떨리지 않도록 => 주의 월드좌표 ==> 나중에 다시 짜자 ㅠㅠ 코드가 이해하기 힘들다 ㅠㅠ
        if (this.getPlacementAttachType() === EPlacementAttachType.Wall) {
            this._cachedGridRay.direction = this.forward.scale(-1);
            if (this.forward.z > 0.9) {
                //Right Wall
                this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(0.05, -0.05, 0)).add(this._cachedGridRay.direction.scale(-0.1));
            }
            else if (this.forward.x < -0.9) {
                //Left Wall
                this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(0, -0.05, -0.05)).add(this._cachedGridRay.direction.scale(-0.1));
            }
        }
        else {
            this._cachedGridRay.direction = BABYLON.Vector3.Down();
            if (null === this.parent) {
                this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(0.05, 0, -0.05)).add(this._cachedGridRay.direction.scale(-0.1));
            }
            else {
                //부모의 회전 방향에 따라서 보정해 줘야한다.. 않그러면 계속 이동하는 버그가 생긴다.!! ==> 코드정리 필요!!!
                const parentController = this.parent as ItemController;
                if (parentController.getPlacementRotationType() === ePlacementRotationType.Rot_0) {
                    this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(0.05, 0, -0.05)).add(this._cachedGridRay.direction.scale(-0.1));
                }
                else if (parentController.getPlacementRotationType() === ePlacementRotationType.Rot_90) {
                    this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(-0.05, 0, -0.05)).add(this._cachedGridRay.direction.scale(-0.1));
                }
                else if (parentController.getPlacementRotationType() === ePlacementRotationType.Rot_180) {
                    this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(-0.05, 0, 0.05)).add(this._cachedGridRay.direction.scale(-0.1));
                }
                else {
                    this._cachedGridRay.origin = this.getAbsolutePosition().add(new BABYLON.Vector3(0.05, 0, 0.05)).add(this._cachedGridRay.direction.scale(-0.1));
                }
            }
        }

        //BABYLON.RayHelper.CreateAndShow(this._cachedGridRay, this._scene, BABYLON.Color3.Green());
        return this._cachedGridRay;
    }

    public setPlacementRotation(rot: ePlacementRotationType) {
        if (this.getPlacementAttachType() === EPlacementAttachType.Wall) {
            return;
        }
        this._placementRot = rot;
        this.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(45 * RoomOject.convertRotationTypeToIndex(this._placementRot)), 0);
    }

    public isChildMesh(mesh: BABYLON.AbstractMesh): boolean {
        return this.getChildMeshes().findIndex((m) => mesh === m) >= 0;
    }

    public aligneDir(dir: BABYLON.Vector3) {
        this.rotationQuaternion = BABYLON.Quaternion.FromLookDirectionLH(dir, BABYLON.Vector3.Up());
    }

    public addToShadowMapRenderList() {
        this._context.getEnvController()!.addShadowCastMeshes(this.getChildMeshes());
    }

    public removeFromShadowMapRenderList() {
        this._context.getEnvController()!.removeShadowCastMeshes(this.getChildMeshes());
    }

    public addCanvasPositionEventHandler_Top(handler: (canvasPos: BABYLON.Vector3) => void) {
        this._canvasPositionEventHandler_Top = handler;
        this._canvasPositionEvnetObserver_Top = this._scene.onAfterRenderObservable.add(() => {
            if (this._canvasPositionEventHandler_Top) {
                this._canvasPositionEventHandler_Top(this._getCanvasPos_Top());
            }
        });
    }

    public clearCanvasPositionEventHandler_Top() {
        this._scene.onAfterRenderObservable.remove(this._canvasPositionEvnetObserver_Top);
    }

    public addCanvasPositionEventHandler_Bottom(handler: (canvasPos: BABYLON.Vector3) => void) {
        this._canvasPositionEventHandler_Bottom = handler;
        this._canvasPositionEvnetObserver_Bottom = this._scene.onAfterRenderObservable.add(() => {
            if (this._canvasPositionEventHandler_Bottom) {
                this._canvasPositionEventHandler_Bottom(this._getCanvasPos_Bottom());
            }
        });
    }

    public clearCanvasPositionEventHandler_Bottom() {
        this._scene.onAfterRenderObservable.remove(this._canvasPositionEvnetObserver_Bottom);
    }

    private _getCanvasPos_Top(): BABYLON.Vector3 {
        if (this._canvasPosttionOffset_Top === null) {
            this._canvasPosttionOffset_Top = new BABYLON.Vector3(0, this._getHeight() + 0.3, 0);
        }
        const uiWorldPos = BABYLON.Vector3.TransformCoordinates(this._canvasPosttionOffset_Top!, this.getWorldMatrix());
        return this._context.getCamera()!.calculateScreenPos(uiWorldPos);
    }

    private _getCanvasPos_Bottom(): BABYLON.Vector3 {
        if (this._canvasPosttionOffset_Bottom === null) {
            this._canvasPosttionOffset_Bottom = new BABYLON.Vector3(0, 0, 0);
        }
        const uiWorldPos = BABYLON.Vector3.TransformCoordinates(this._canvasPosttionOffset_Bottom!, this.getWorldMatrix());
        return this._context.getCamera()!.calculateScreenPos(uiWorldPos);
    }

    protected _getHeight(): number {
        return this.getBoundingInfo().boundingBox.maximum.y;
    }

    public resetCanvasOffsetPos() {
        this._canvasPosttionOffset_Top = null;
        this._canvasPosttionOffset_Bottom = null;
    }

    //-----------------------------------------------------------------------------------
    // static helper
    //-----------------------------------------------------------------------------------
    public static convertRotationTypeToIndex(rot: ePlacementRotationType): number {
        if (rot === ePlacementRotationType.Rot_0) {
            return 0;
        }
        else if (rot === ePlacementRotationType.Rot_45) {
            return 1;
        }
        else if (rot === ePlacementRotationType.Rot_90) {
            return 2;
        }
        else if (rot === ePlacementRotationType.Rot_135) {
            return 3;
        }
        else if (rot === ePlacementRotationType.Rot_180) {
            return 4;
        }
        else if (rot === ePlacementRotationType.Rot_225) {
            return 5;
        }
        else if (rot === ePlacementRotationType.Rot_270) {
            return 6;
        }
        else if (rot === ePlacementRotationType.Rot_315) {
            return 7;
        }

        console.error(`RoomObject.convertRotationTypeToIndex() : not handled rot type = ${rot}`);
        return 0;
    }

    public static convertIndexToRotationType(index: number): ePlacementRotationType {
        if (index === 0) {
            return ePlacementRotationType.Rot_0;
        }
        else if (index === 1) {
            return ePlacementRotationType.Rot_45;
        }
        else if (index === 2) {
            return ePlacementRotationType.Rot_90;
        }
        else if (index === 3) {
            return ePlacementRotationType.Rot_135;
        }
        else if (index === 4) {
            return ePlacementRotationType.Rot_180;
        }
        else if (index === 5) {
            return ePlacementRotationType.Rot_225;
        }
        else if (index === 6) {
            return ePlacementRotationType.Rot_270;
        }
        else if (index === 7) {
            return ePlacementRotationType.Rot_315;
        }

        console.error(`RoomObject.convertIndexToRotationType() : not handled index number = ${index}`);
        return ePlacementRotationType.Rot_0;

    }

    public static getAddRotationTypes(rot1: ePlacementRotationType, rot2: ePlacementRotationType): ePlacementRotationType {
        const rot1Idx = RoomOject.convertRotationTypeToIndex(rot1);
        const rot2Idx = RoomOject.convertRotationTypeToIndex(rot2);
        return RoomOject.convertIndexToRotationType((rot1 + rot2) % 8);
    }
}