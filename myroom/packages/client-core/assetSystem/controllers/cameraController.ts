import * as BABYLON from "@babylonjs/core";
import { Constants } from "../constants";
import { RoomOject } from "./roomSubSystem/roomObject";
import { ConstantsEx } from "../constantsEx";
import { MyRoomController } from "./myRoomController"
import { TableDataManager } from "../../tableData/tableDataManager";
import { CameraSetting } from "../../tableData/defines/System_Interface";
import { set } from "lodash";
import { MyCameraPointersInput } from "./myCameraPointersInput";
import { MyRoomContext } from "../myRoomContext";

export enum ECameraMode {
    MyRoom,
    Avatar,
    Item,
    PlaceMode,
    AvatarCustomizingMode,
    EditStatusMessage,
    Joysam,
    KHConv,
}

const CAMERA_ANI_FRAME = 30;
export class CameraController extends BABYLON.TransformNode {
    private _camera: BABYLON.Nullable<BABYLON.ArcRotateCamera> = null;

    private readonly DEFAULT_ROOM_CAM_ALPHA = 2.341;
    private readonly DEFAULT_ROOM_CAM_BETA: number = 1.315;
    private readonly DEFAULT_ROOM_CAM_RADIUS: number = 15;
    private readonly DEFAULT_ROOM_CAM_TARGET: BABYLON.Vector3 = new BABYLON.Vector3(-Constants.MYROOM_FLOOR_SIZE_METER * 0.5, 2.8, Constants.MYROOM_FLOOR_SIZE_METER * 0.5);
    // 화면좌표계에서, 상하좌우 0%정도 여백이 있도록 카메라를 배치한다.
    // boundingSphere의 반지름을 구해서, 그 반지름만큼 여백을 더해준다.
    private readonly DEFAULT_SCREEN_MARGIN_RATIO = 0;

    private readonly DEFAULT_ITEM_CAM_ALPHA = Math.PI / 2;
    private _cameraDistanceChangeEventHander: ((camDistRatio: number) => void) | null = null;
    private _cameraDistanceChangeEventObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    private _updateRoutine: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    private _resizeHandler: BABYLON.Nullable<() => void> = null;
    private _prevAspectRatio: number = 0;
    private _checkCanvasAspectRatioRoutine: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    private _runUpdateRoutine: boolean = true;
    private _currentCameraSetting: CameraSetting | null = null;
    private _owner: MyRoomContext;

    public getBabylonCamera(): BABYLON.Nullable<BABYLON.Camera> {
        return this._camera;
    }

    public constructor(owner: MyRoomContext, scene: BABYLON.Nullable<BABYLON.Scene>) {
        super("[Camera]", scene);

        this._owner = owner;
        this.parent = null;
        this._createCamera();
        this._checkCanvasAspectRatioRoutine = this._scene?.onBeforeRenderObservable.add(() => this._checkChangeCanvasAspectRatio());

        this.onDispose = () => { this.finalize(); };
    }

    public finalize() {
        if (this._checkCanvasAspectRatioRoutine) {
            this._scene?.onBeforeRenderObservable.remove(this._checkCanvasAspectRatioRoutine);
            this._checkCanvasAspectRatioRoutine = null;
        }
        this._setUpdateRoutine(null);
        this._resizeHandler = null;
    }

    public lockControl(bLock: boolean) {
        bLock ? this._camera!.detachControl() : this._camera!.attachControl();
    }

    public changeCameraMode(cameraMode: ECameraMode, target?: RoomOject | MyRoomController | null) {
        let cameraSetting = TableDataManager.getInstance().findCameraSetting(Constants.SCENE_TYPE_MYROOM);
        const setting = TableDataManager.getInstance().findCameraSetting(this._getCameraSettingIdFrom(cameraMode));
        if (setting) cameraSetting = setting;

        if (cameraSetting) {
            console.log("changeCameraMode", cameraSetting);
            const enablePanning = cameraSetting.UsePanning || cameraMode === ECameraMode.PlaceMode;
            this._changeCameraMode(cameraSetting, target, enablePanning);
        }

        if (this._camera) {
            this._prevAspectRatio = this._scene.getEngine().getAspectRatio(this._camera);
        }
        this._resizeHandler = () => {
            // fov만 변경한다.
            if (cameraSetting) this._setFov(cameraSetting.FieldOfView);
        };
    }

    private _getCameraSettingIdFrom(cameraMode: ECameraMode): string {
        const suffix = ""; //this._camera && this._scene.getEngine().getAspectRatio(this._camera) >= 0.8 ? Constants.SCENE_TYPE_SUFFIX_WIDE : "";
        let result = Constants.SCENE_TYPE_MYROOM;
        switch (cameraMode) {
            case ECameraMode.MyRoom:
                result = Constants.SCENE_TYPE_MYROOM;
                break;
            case ECameraMode.Avatar:
                result = Constants.SCENE_TYPE_AVATAR;
                break;
            case ECameraMode.Item:
                result = Constants.SCENE_TYPE_ITEM;
                break;
            case ECameraMode.PlaceMode:
                result = Constants.SCENE_TYPE_PLACEMODE;
                break;
            case ECameraMode.AvatarCustomizingMode:
                result = Constants.SCENE_TYPE_AVATAR_CUSTOMIZING;
                break;
            case ECameraMode.EditStatusMessage:
                result = Constants.SCENE_TYPE_STATUSMESSAGE;
                break;
            case ECameraMode.Joysam:
                result = Constants.SCENE_TYPE_JOYSAM;
                break;
            case ECameraMode.KHConv:
                result = Constants.SCENE_TYPE_KHCONV;
                break;
            default:
                console.error("_getCameraSettingIdFrom : not implemented", cameraMode);
                result = Constants.SCENE_TYPE_MYROOM;
                break;
        }
        return result + suffix;
    }

    public calculateScreenPos(worldPos: BABYLON.Vector3): BABYLON.Vector3 {
        //참고자료 https://playground.babylonjs.com/#R1F8YU#101
        const engine = this._scene.getEngine();
        return BABYLON.Vector3.Project(
            worldPos, //vector to project
            BABYLON.Matrix.Identity(), //world matrix
            this._scene.getTransformMatrix(), //transform matrix
            this._camera!.viewport.toGlobal(
                engine.getRenderWidth() * engine._hardwareScalingLevel,
                engine.getRenderHeight() * engine._hardwareScalingLevel,
            )
        );
    }

    public setCameraTargetPos(targetPos: BABYLON.Vector3) {
        this._camera?.setTarget(targetPos);
    }


    public addCameraDistanceChangeEventHandler(handler: (camDistRatio: number) => void) {
        this._cameraDistanceChangeEventHander = handler;
        this._cameraDistanceChangeEventObserver = this._scene.onAfterRenderObservable.add(() => {
            if (this._cameraDistanceChangeEventHander) {
                this._cameraDistanceChangeEventHander(this._getCameraDistRatio());
            }
        });
    }

    public clearCameraDistanceChangeEventHandler() {
        this._scene.onAfterRenderObservable.remove(this._cameraDistanceChangeEventObserver);
    }

    public setCameraDist(camDistRatio: number) {
        if (this._camera && this._camera.upperRadiusLimit) {
            this._camera.radius = camDistRatio * this._camera.upperRadiusLimit;
        }
    }

    // return : camera restore function
    public zoomIn(target: RoomOject, zoomInCompleteFunc?: () => void): (() => void) | null {
        if (!this._camera) return null;

        const prevAlpha = this._camera.alpha;
        const prevBeta = this._camera.beta;
        const prevRadius = this._camera.radius;
        const prevTarget = this._camera.target;

        const prevLowerRadius = this._camera.lowerRadiusLimit;

        // 정면을 바라보도록 한다.
        let direction = new BABYLON.Vector3(1, 0, 0);
        direction = BABYLON.Vector3.TransformNormal(direction, target.getWorldMatrix()).normalize();
        let alpha = Math.atan2(direction.z, direction.x) + Math.PI * 0.5;
        let beta = 1.3;

        const minRadius = this._calcualteCameraRadius(target, true);
        let radius = minRadius;
        this._camera.lowerRadiusLimit = radius;
        if (this._currentCameraSetting) {
            if (this._currentCameraSetting.LowerAlphaLimitAtFocus !== -1) alpha = Math.max(alpha, this._currentCameraSetting.LowerAlphaLimitAtFocus);
            if (this._currentCameraSetting.UpperAlphaLimitAtFocus !== -1) alpha = Math.min(alpha, this._currentCameraSetting.UpperAlphaLimitAtFocus);
        }

        let camTarget = target.getBoundingInfo().boundingSphere.centerWorld;
        this._owner.changeRenderLoop(true);
        this._runUpdateRoutine = false;
        this._tweenCamera(this._camera, alpha, beta, radius, camTarget, CAMERA_ANI_FRAME * 2, () => {
            this._owner.changeRenderLoop(false);
            zoomInCompleteFunc?.();
        });

        return () => {
            if (this._camera) {
                this._owner.changeRenderLoop(true);
                this._tweenCamera(this._camera, prevAlpha, prevBeta, prevRadius, prevTarget, CAMERA_ANI_FRAME * 2, () => {
                    this._owner.changeRenderLoop(false);
                    this._runUpdateRoutine = true;
                    if (this._camera) {
                        this._camera.lowerRadiusLimit = prevLowerRadius;
                    }
                });
            }
        }
    }

    //-----------------------------------------------------------------------------------
    // Private
    //-----------------------------------------------------------------------------------

    private _createCamera() {

        this._camera = new BABYLON.ArcRotateCamera("camera", this.DEFAULT_ROOM_CAM_ALPHA, this.DEFAULT_ROOM_CAM_BETA, this.DEFAULT_ROOM_CAM_RADIUS, this.DEFAULT_ROOM_CAM_TARGET, this._scene);
        // 그림자의 퀄리티를 올리기 위해서 far값 수정
        this._camera.maxZ = 1000;
        this._camera.inputs.remove(this._camera.inputs.attached.pointers);
        this._camera.inputs.add(new MyCameraPointersInput());
        this._camera.attachControl();
        this._camera.parent = this;

        // 처음에는 그냥 default로 설정한다.
        //this.changeCameraMode(ECameraMode.MyRoom, null);
    }

    private _getCameraDistRatio(): number {
        if (this._camera && this._camera.upperRadiusLimit) {
            return this._camera.radius / this._camera.upperRadiusLimit;
        }

        return 1.0;
    }

    private _checkChangeCanvasAspectRatio() {
        if (this._camera) {
            const asp = this._scene.getEngine().getAspectRatio(this._camera);
            if (this._prevAspectRatio !== asp) {
                this._prevAspectRatio = asp;
                this._resizeHandler?.();
            }
        }
    }

    private _tweenCamera(camera: BABYLON.ArcRotateCamera, alpha: number, beta: number, radius: number, target: BABYLON.Vector3, speed: number, finishAction: () => void) {
        const ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        BABYLON.Animation.CreateAndStartAnimation('camSpin1', camera, 'alpha', speed, CAMERA_ANI_FRAME, camera.alpha, alpha, 0, ease);
        BABYLON.Animation.CreateAndStartAnimation('camSpin2', camera, 'beta', speed, CAMERA_ANI_FRAME, camera.beta, beta, 0, ease);
        BABYLON.Animation.CreateAndStartAnimation('camSpin3', camera, 'radius', speed, CAMERA_ANI_FRAME, camera.radius, radius, 0, ease);
        BABYLON.Animation.CreateAndStartAnimation('camSpin4', camera, 'target', speed, CAMERA_ANI_FRAME, camera.target, target, 0, ease, finishAction);
    };


    //-----------------------------------------------------------------------------------
    // Camera Mode:
    //-----------------------------------------------------------------------------------
    private _changeCameraMode(cameraSetting: CameraSetting, target?: RoomOject | MyRoomController | null, enablePanning: boolean = false) {
        this._currentCameraSetting = cameraSetting;
        if (this._camera && target) {
            this._setFov(cameraSetting.FieldOfView);
            let defaultTargetPos = BABYLON.Vector3.Zero();
            this._camera.setTarget(defaultTargetPos.clone());

            if (cameraSetting.LowerAlphaLimit === -1 && cameraSetting.UpperAlphaLimit === -1) {
                this._camera.lowerAlphaLimit = null;
                this._camera.upperAlphaLimit = null;
            } else {
                this._camera.lowerAlphaLimit = cameraSetting.LowerAlphaLimit;
                this._camera.upperAlphaLimit = cameraSetting.UpperAlphaLimit;
            }
            if (cameraSetting.LowerBetaLimit === -1 && cameraSetting.UpperBetaLimit === -1) {
                this._camera.lowerBetaLimit = null;
                this._camera.upperBetaLimit = null;
            } else {
                this._camera.lowerBetaLimit = cameraSetting.LowerBetaLimit;
                this._camera.upperBetaLimit = cameraSetting.UpperBetaLimit;
            }

            // 회전/패닝의 관성효과는 없앤다.
            this._camera.inertia = 0.5;
            this._camera.panningInertia = 0;
            // bouncing 관련효과도 없앤다.
            this._camera.allowUpsideDown = false;
            this._camera.useBouncingBehavior = false;

            const ratio = 1;// / this._scene.getEngine()._hardwareScalingLevel;//ConstantsEx.getDeviceRatio();
            // 민감도를 ratio에 따라 나누어주는 이유는, rendering fps가 달라짐에 따라서, 민감도 조절을 해야 하기 때문.
            this._camera.wheelPrecision = 2 / ratio;
            this._camera.pinchPrecision = 50 / ratio;
            this._camera.angularSensibilityX = 250 / ratio;
            this._camera.angularSensibilityY = this._camera!.angularSensibilityX;
            this._camera.panningSensibility = enablePanning ? 250 / ratio : 0;

            // 초기화
            this._camera.radius = 10;
            this._camera.lowerRadiusLimit = 3;
            this._camera.upperRadiusLimit = 15;

            this._camera.alpha = cameraSetting.Alpha;
            this._camera.beta = cameraSetting.Beta;

            if (target) {
                const baseRadius = this._calcualteCameraRadius(target, false);
                const maxRadius = baseRadius * cameraSetting.MaxZoomOut;
                const curRadius = baseRadius * cameraSetting.DefaultZoom;

                const bound = target.getBoundingInfo(false);

                //console.error("diffY", diffY, maxBound, bound.boundingSphere.radiusWorld);

                defaultTargetPos = bound.boundingSphere.centerWorld.add(new BABYLON.Vector3(0, cameraSetting.OffsetY, 0));
                this._camera.setTarget(defaultTargetPos.clone());

                if (cameraSetting.FixToBottom) {
                    setTimeout(() => {
                        if (this._camera) {
                            const maxBound = curRadius * Math.tan(this._camera.fov / 2);
                            const diffY = maxBound - bound.boundingSphere.radiusWorld;

                            const upVec = BABYLON.Vector3.Up(); //this._camera.getDirection(BABYLON.Vector3.Up());
                            //const rightVec = this._camera.getDirection(BABYLON.Vector3.Right());
                            //console.error("diffY", diffY, maxBound, bound.boundingSphere.radiusWorld);
                            defaultTargetPos = bound.boundingSphere.centerWorld.add(upVec.scale(diffY)).add(new BABYLON.Vector3(0, cameraSetting.OffsetY, 0));
                            this._camera.setTarget(defaultTargetPos.clone());

                            // target을 바꾸었으므로, 다시 설정한다.
                            this._camera.alpha = cameraSetting.Alpha;
                            this._camera.beta = cameraSetting.Beta;
                        }
                    }, 50);
                }


                this._camera.radius = curRadius;
                this._camera.lowerRadiusLimit = baseRadius * cameraSetting.MaxZoomIn;
                this._camera.upperRadiusLimit = maxRadius;

                // target을 바꾸었으므로, 다시 설정한다.
                this._camera.alpha = cameraSetting.Alpha;
                this._camera.beta = cameraSetting.Beta;

                let prevRadius = 0;
                if (enablePanning) {
                    this._setUpdateRoutine(() => {
                        try {
                            if (!this._camera || !this._runUpdateRoutine) return;
                            const curRadius = this._camera.radius;
                            if (prevRadius !== this._camera.radius) {
                                const diffRadius = curRadius - prevRadius;
                                const _prev = prevRadius;
                                prevRadius = curRadius;

                                // zoom 중에, target을 defaultTargetPos로 이동시킨다.
                                if (diffRadius > 0) {
                                    const ratio = Math.min(1, Math.max(0, diffRadius / (maxRadius - _prev)));
                                    this._camera.setTarget(BABYLON.Vector3.Lerp(this._camera.target, defaultTargetPos, ratio));
                                }
                            }

                            // target in range
                            this._checkCamerPanningInScreen(target);

                        } catch (e) {
                            console.error("_setUpdateRoutine", e);
                        }
                    });
                } else {
                    this._setUpdateRoutine(null);
                }
            }
        }
    }

    private _setFov(fovHorizontal: number) {
        // tan(fovV/2) = tan(fovH/2) / aspectRatio
        const aspectRatio = this._scene.getEngine().getAspectRatio(this._camera!);
        this._camera!.fov = 2 * Math.atan(Math.tan(fovHorizontal / 2) / aspectRatio);

        console.log("_setFov", this._camera!.fov);
    }

    //private _renderPoints = false;
    private _checkCamerPanningInScreen(target: RoomOject | MyRoomController) {
        if (!this._camera) return;

        // 1. 현재 target의 screen 내의 범위에 따라서, panning range를 조절한다.
        const bound = target.getBoundingInfo(false);
        const center = bound.boundingSphere.centerWorld;
        const boundVecs = bound.boundingBox.vectorsWorld;
        const tangent = Math.tan(this._camera.fov / 2);

        // if (!this._renderPoints) {
        //     this._renderPoints = true;

        //     for (const pt of boundVecs) {
        //         const sitBox = BABYLON.MeshBuilder.CreateBox(
        //             "box",
        //             { width: 0.2, depth: 0.2, height: 0.2 },
        //             this._scene
        //         );
        //         sitBox.position = pt;
        //     }
        // }

        const camVec = this._camera.getDirection(BABYLON.Vector3.Forward());
        const upVec = this._camera.getDirection(BABYLON.Vector3.Up());
        const rightVec = this._camera.getDirection(BABYLON.Vector3.Right());

        const toCenterDir = center.subtract(this._camera.globalPosition);
        const distance = BABYLON.Vector3.Dot(toCenterDir, camVec);
        const camOrigin = this._camera.globalPosition.add(camVec.scale(distance));

        let offsetWorld = BABYLON.Vector3.Zero();

        const aspectRatio = this._scene.getEngine().getAspectRatio(this._camera);
        //const maxBoundV = tangent * distance;
        const maxBoundH = tangent * distance * aspectRatio;

        let maxRatioV = -Infinity;
        let maxPointV = -Infinity;
        let maxPointV_Bound = -Infinity;

        let minRatioV = Infinity;
        let minPointV = Infinity;
        let minPointV_Bound = Infinity;

        let maxRatioH = -Infinity;
        let maxPointH = -Infinity;
        let maxPointH_Bound = -Infinity;

        let minRatioH = Infinity;
        let minPointH = Infinity;
        let minPointH_Bound = Infinity;

        for (const pt of boundVecs) {
            const camDist = Math.abs(BABYLON.Vector3.Dot(pt.subtract(this._camera.globalPosition), camVec));
            // 세로축 : 각 pt에서 upVec로 올려서, 카메라 중앙 plane 과 만나는 점까지의 거리를 구한다.
            const thisPointV = BABYLON.Vector3.Dot(pt.subtract(this._camera.globalPosition), upVec);
            const thisBoundV = tangent * camDist;
            const ratioV = thisPointV / thisBoundV;
            if (ratioV > maxRatioV) {
                maxRatioV = ratioV;
                maxPointV = thisPointV;
                maxPointV_Bound = thisBoundV;
            } else if (ratioV < minRatioV) {
                minRatioV = ratioV;
                minPointV = thisPointV;
                minPointV_Bound = thisBoundV;
            }
            // 가로축 : 각 pt에서 rightVec로 올려서, 카메라 중앙 plane 과 만나는 점까지의 거리를 구한다.
            const thisPointH = BABYLON.Vector3.Dot(pt.subtract(this._camera.globalPosition), rightVec);
            const thisBoundH = tangent * camDist * aspectRatio;
            const ratioH = thisPointH / thisBoundH;
            if (ratioH > maxRatioH) {
                maxRatioH = ratioH;
                maxPointH = thisPointH;
                maxPointH_Bound = thisBoundH;
            } else if (ratioH < minRatioH) {
                minRatioH = ratioH;
                minPointH = thisPointH;
                minPointH_Bound = thisBoundH;
            }
        }

        // center가 아래쪽에 있는데, 위로 공간이 남는다면, 위로 올린다.
        if (maxPointV < maxPointV_Bound && minPointV < -minPointV_Bound) {
            const diff = Math.min(-minPointV_Bound - minPointV, maxPointV_Bound - maxPointV);
            offsetWorld = offsetWorld.subtract(upVec.scale(diff));
        } else if (minPointV > -minPointV_Bound && maxPointV > maxPointV_Bound) {
            const diff = Math.min(maxPointV - maxPointV_Bound, minPointV_Bound + minPointV);
            offsetWorld = offsetWorld.subtract(upVec.scale(-diff));
        }

        if (maxPointH < maxPointH_Bound && minPointH < -minPointH_Bound) {
            const diff = Math.min(-minPointH_Bound - minPointH, maxPointH_Bound - maxPointH);
            offsetWorld = offsetWorld.subtract(rightVec.scale(diff));
            //console.log("diff", [diff, maxBoundH, maxBoundPointH, minBoundPointH, centerPointH]);
        } else if (minPointH > -minPointH_Bound && maxPointH > maxPointH_Bound) {
            const diff = Math.min(maxPointH - maxPointH_Bound, minPointH_Bound + minPointH);
            offsetWorld = offsetWorld.subtract(rightVec.scale(-diff));
            //console.log("-diff", [-diff, maxBoundH, maxBoundPointH, minBoundPointH, centerPointH]);
        }

        // 가끔 마우스를 휙 이동하면, 튀는 경우가 있다.
        // fov가 클경우, 기존에는 가까운 점이 수평적으로 더 멀리있었는데, 마우스를 휙이동하면, 먼 점이 수평적으로 더 멀리있는것처럼 되어, max index 가 바뀌어 튀는 경우가 있다.
        // 마이룸처럼 fov가 작으면 이럴 경우가 없어서 우선 무시한다.

        this._camera.setTarget(this._camera.target.add(offsetWorld));
        // camera는 기본적으로 local offset과 global offset이 같다고 가정함. (아래와 같은 계산을 했을때, 약간의 오차가 생김)
        //const offsetLocal = BABYLON.Vector3.TransformNormal(offsetWorld, this._camera.getWorldMatrix().clone().invert());
        this._camera.setPosition(this._camera.position.add(offsetWorld));

        // 2. 현재 줌인 정도에 따라서, panning input을 변경한다.
        const centerPoint = BABYLON.Vector3.Dot(center.subtract(camOrigin), upVec);
        const centerPointH = BABYLON.Vector3.Dot(center.subtract(camOrigin), rightVec);
        const CHECK_RATIO = 1.1;
        let nowPanddingMode = false;
        if (aspectRatio < 1) {
            // 박스가 screen보다 커지면, panning input을 변경한다.
            nowPanddingMode = maxPointH - centerPointH > maxPointH_Bound * CHECK_RATIO;
        } else {
            nowPanddingMode = maxPointV - centerPoint > maxPointV_Bound * CHECK_RATIO;
        }
        this._camera._panningMouseButton = nowPanddingMode ? 0 : 1;

        // 3. 현재 줌인 정도에 따라서, panning sensibility를 변경한다.
        const ratio = 1 / this._scene.getEngine()._hardwareScalingLevel;
        this._camera.panningSensibility = this._scene.getEngine().getRenderWidth() / (maxBoundH * 2) / ratio;
    }

    private _lerpTargetValue(curValue: number, minValue: number, maxValue: number, minTarget: number, maxTarget: number): number {
        curValue = Math.min(Math.max(curValue, minValue), maxValue);
        const ratio = (curValue - minValue) / (maxValue - minValue);
        return minTarget + (maxTarget - minTarget) * ratio;
    }

    private _setUpdateRoutine(routine: (() => void) | null) {
        if (this._updateRoutine) {
            this._scene.onBeforeRenderObservable.remove(this._updateRoutine);
            this._updateRoutine = null;
        }
        if (routine) {
            this._updateRoutine = this._scene.onBeforeRenderObservable.add(routine);
        }
    }
    /*
        private _changeCameraMode_Item(target?: RoomOject | MyRoomController | null) {
            if (this._camera && target) {
                const bound = target.getBoundingInfo(false);
                this.position = BABYLON.Vector3.Zero();
                this._camera!.target = bound.boundingSphere.centerWorld;
                let viewRadius = this._calcualteCameraRadius(target);
                this._camera!.alpha = this.DEFAULT_ITEM_CAM_ALPHA;
                this._camera!.beta = this.DEFAULT_ROOM_CAM_BETA;
                this._camera!.radius = viewRadius;
                this._camera!.lowerRadiusLimit = Math.max(1.5, viewRadius);
                this._camera!.upperRadiusLimit = Math.max(5, viewRadius * 2);
                this._camera!.useBouncingBehavior = false;
    
                this._camera.lowerBetaLimit = null;
                this._camera.upperBetaLimit = null;
                this._camera.lowerAlphaLimit = null;
                this._camera.upperAlphaLimit = null;
                //this._camera.useBouncingBehavior = true;
    
                const ratio = ConstantsEx.getDeviceRatio();
                this._camera.wheelPrecision = 20 / ratio;
                this._camera.pinchPrecision = 100 / ratio;
                this._camera.panningSensibility = 1500 / ratio;
                this._camera.allowUpsideDown = false;
            }
        }
    
    
        private _changeCameraMode_MyRoom(target?: RoomOject | MyRoomController | null) {
            if (this._camera) {
                this._camera.alpha = this.DEFAULT_ROOM_CAM_ALPHA;
                this._camera.beta = this.DEFAULT_ROOM_CAM_BETA;
                this._camera.radius = this.DEFAULT_ROOM_CAM_RADIUS;
    
                const ratio = ConstantsEx.getDeviceRatio();
                this._camera.wheelPrecision = 20 / ratio;
                this._camera.pinchPrecision = 100 / ratio;
                this._camera.panningSensibility = 500 / ratio;
                this._camera.allowUpsideDown = false;
    
                this._camera.lowerBetaLimit = 0.1;
                this._camera.upperBetaLimit = 1.54;
                this._camera.lowerAlphaLimit = 1.6;
                this._camera.upperAlphaLimit = 3.15;
                this._camera.panningDistanceLimit = 8;
    
                this._camera.attachControl();
    
                this._camera.parent = this;
    
                const ortho = false;
                if (ortho) {
                    // In BabylonJS the orthographic projection is available for all camera types.
                    this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                    // For the orthographic camera mode we need to set the left, right, bottom and
                    // top boundaries. Usually you'll want to maintain the aspect ratio of the
                    // renderer canvas.
                    const rect = this._scene.getEngine().getRenderingCanvasClientRect();
                    const aspect = rect!.height / rect!.width;
                    // In this example we'll set the distance based on the camera's radius.
                    this._camera.orthoLeft = -this._camera.radius;
                    this._camera.orthoRight = this._camera.radius;
                    this._camera.orthoBottom = -this._camera.radius * aspect;
                    this._camera.orthoTop = this._camera.radius * aspect;
    
                    console.log(this._camera.orthoLeft, this._camera.orthoRight, this._camera.orthoBottom, this._camera.orthoTop);
                }
            }
        }
    */
    private _calcualteCameraRadius(target?: RoomOject | MyRoomController | null, ignoreStatusObject: boolean = false): number {
        if (this._camera && target) {
            const bound = target.getBoundingInfo(ignoreStatusObject);
            const size = bound.boundingBox.extendSizeWorld;
            // sphere로 할경우, 부정확할 때가 있어서, box의 max element * 1.4로 처리한다.
            const radius = Math.max(size.x, size.y, size.z) * 1.4;
            const aspectRatio = this._scene.getEngine().getAspectRatio(this._camera);
            //console.warn("aspectRatio", aspectRatio);
            let halfMinFov = this._camera.fov / 2;
            if (aspectRatio < 1) {
                halfMinFov = Math.atan(aspectRatio * Math.tan(this._camera.fov / 2));
            }
            const cameraRadius = Math.abs(radius / Math.sin(halfMinFov));
            //console.error("_calcualteCameraRadius", [bound, radius, cameraRadius]);
            return cameraRadius;
        }
        return 15;
    }

}