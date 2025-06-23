import * as BABYLON from "@babylonjs/core";
import { AvatarAnimation } from "./avatarSubSystem/avatarAnimation";
import { IAssetLoader, eAssetType, eRoomObjectType } from "../definitions";
import { AvatarSkeleton } from "./avatarSubSystem/avatarSkeleton";
import { AvatarEquipment } from "./avatarSubSystem/avatarEquipment";
import { AvatarParticle } from "./avatarSubSystem/avatarParticle";
import { RoomOject } from "./roomSubSystem/roomObject";
import { IAssetManifest_Avatar } from "../jsonTypes/manifest/assetManifest_Avatar";
import { IMyRoomFigurePlacementInfo } from "../jsonTypes/manifest/assetManifest_MyRoom";
import { Constants } from "../constants";
import { MyRoomController } from "./myRoomController";
import { MyRoomContext } from "../myRoomContext";
import { EPlacementAttachType } from "../../tableData/defines/System_Enum";
import { AvatarCustomization } from "./avatarSubSystem/avatarCustomization";
import { AvatarFacialExpression } from "./avatarSubSystem/avatarFacialExpression";

// todo : constants 시트로 옮기기
const FIGURE_SIZE = 0.5;
const OUTSIDE_SIZE = 0.75;

export class AvatarController extends RoomOject {
    private _assetLoader: IAssetLoader;
    private _avatarId: string;

    private _avatarSkeleton: AvatarSkeleton;
    private _avatarAnimation: AvatarAnimation;
    private _avatarEquipment: AvatarEquipment;
    private _avatarCustomization: AvatarCustomization;
    private _avatarParticle: AvatarParticle;
    private _avatarFacialExpression: AvatarFacialExpression;

    private _isFigure: boolean = false;
    private _modelRoot: BABYLON.TransformNode;
    private _isOutside: boolean = false;

    private _initPos: BABYLON.Vector3 | null = null;

    private _keepPlaceInfo: IMyRoomFigurePlacementInfo | null = null;
    private _headNode: BABYLON.Nullable<BABYLON.TransformNode> = null;

    public isFigure(): boolean {
        return this._isFigure;
    }

    public isOutside(): boolean {
        return this._isOutside;
    }

    public getAvatarId(): string {
        return this._avatarId;
    }

    public getAssetLoader(): IAssetLoader {
        return this._assetLoader;
    }

    public getAvatarSkeleton(): AvatarSkeleton {
        return this._avatarSkeleton;
    }

    public getAvatarAnimation(): AvatarAnimation {
        return this._avatarAnimation;
    }

    public getAvatarEquipment(): AvatarEquipment {
        return this._avatarEquipment;
    }

    public getAvatarCustomization(): AvatarCustomization {
        return this._avatarCustomization;
    }

    public getAvatarParticle(): AvatarParticle {
        return this._avatarParticle;
    }

    public getAvatarFacialExpression(): AvatarFacialExpression {
        return this._avatarFacialExpression;
    }

    public getScene(): BABYLON.Scene {
        return this._scene;
    }

    public getModelRootTransform(): BABYLON.TransformNode {
        return this._modelRoot;
    }

    public setDefaultRootTransform(node: BABYLON.TransformNode) {
        node.rotation = new BABYLON.Vector3(0, Math.PI, 0);
        node.scaling = new BABYLON.Vector3(1.0, 1.0, -1.0);
    }

    public getSkinRootMesh(): BABYLON.AbstractMesh {
        return this._modelRoot.getChildMeshes(true, (m) => { return m.name === "__root__"; })[0];
    }

    // backpack에 넣을때 자신의 placeInfo를 저장하기 위한 용도. (wall이 없어 hide되면, placement에서 빠지기 때문에, make로 만들수가 없어서 저장해두는 수 밖에 없다.)
    public getKeepPlaceInfo(): BABYLON.Nullable<IMyRoomFigurePlacementInfo> {
        return this._keepPlaceInfo;
    }

    public setKeepPlaceInfo(info: BABYLON.Nullable<IMyRoomFigurePlacementInfo>) {
        this._keepPlaceInfo = info;
    }

    public constructor(avatarId: string, scene: BABYLON.Nullable<BABYLON.Scene>, assetLoader: IAssetLoader, context: MyRoomContext, ownerRoom: MyRoomController | null, isOutside: boolean = false) {
        super(context, ownerRoom, eRoomObjectType.Figure, `[아바타] (${avatarId})`, scene);

        this.parent = null;
        this._isOutside = isOutside;
        this._avatarId = avatarId;
        this._assetLoader = assetLoader;
        // this._modelRoot = new BABYLON.TransformNode("Model");
        this._modelRoot = new BABYLON.TransformNode("Model", this._scene);
        this._modelRoot.parent = this;

        this._avatarSkeleton = new AvatarSkeleton(this);
        this._avatarAnimation = new AvatarAnimation(this);
        this._avatarEquipment = new AvatarEquipment(this);
        this._avatarCustomization = new AvatarCustomization(this);
        this._avatarParticle = new AvatarParticle(this);
        this._avatarFacialExpression = new AvatarFacialExpression(this);

        this._setPlacementSize();

        this.refreshCustomInspectorProperties();

        this.onDispose = () => { this.finalize(); };
        if (this._ownerRoom && !isOutside) {
            this._ownerRoom.getRoomObjectCounter().registerAvatarController(this);
        }
    }

    public finalize() {

        this._avatarEquipment.finalize();
        this._avatarAnimation.finalize();
        this._avatarSkeleton.finalize();
        this._avatarCustomization.finalize();
        this._avatarParticle.finalize();
        this._avatarFacialExpression.finalize();

        this.removeFromShadowMapRenderList();
        if (this._ownerRoom && !this._isOutside) {
            this._ownerRoom.getRoomObjectCounter().unregisterAvatarController(this);
        }
    }

    public async initModel() {
        //await this._assetLoader.loadAssetIntoScene(eAssetType.Avatar, this._avatarId);
        const manifest = await this._assetLoader.loadManifest<IAssetManifest_Avatar>(eAssetType.Avatar, this._avatarId, undefined);
        if (null != manifest) {
            await this.loadModelFromManifest(manifest, Constants.USE_IDLE_ANIMATION_TIME_GAP);
            this.addToShadowMapRenderList();
        }
    }

    public async refreshModel() {
        this.finalize();
        await this.initModel();
    }

    public async loadModelFromManifest(manifest: IAssetManifest_Avatar, useIdleAnimationGap?: boolean) {
        //figrue 모델싸이즈 줄이기
        if (this._isOutside) {
            this._modelRoot.scaling = BABYLON.Vector3.One().scale(OUTSIDE_SIZE);
        } else if (this.isFigure()) {
            this._modelRoot.scaling = BABYLON.Vector3.One().scale(FIGURE_SIZE);
        }

        if (manifest) {
            //Skeleton 처리
            await this.getAvatarSkeleton().loadSkeleton(manifest.main.skeleton);

            if (!this.getAvatarSkeleton().getSkeleton()) {
                console.error(`AvatarController.loadModelFromManifest()=> no skeleton , assetId = ${manifest.main.skeleton}`);
                return;
            }

            const processes = [];
            //Equipment 처리
            processes.push(this.getAvatarEquipment().equipAllItems(manifest.main.equipments));

            //Animation 처리
            if (manifest.main.animation && manifest.main.animation !== "") {
                const aniName = manifest.main.animation;

                if (this.getAvatarAnimation().hasAnimation(aniName)) {
                    this.getAvatarAnimation().playAnimation(aniName, false, undefined, useIdleAnimationGap, true);
                }
                else {
                    processes.push(this.getAvatarAnimation().LoadAndPlayAnimation(manifest.main.animation, true, undefined, useIdleAnimationGap));
                }
            }

            await Promise.all(processes);

            //Customization 처리
            this.getAvatarCustomization().applyAvatarCustomization(manifest.main.customizations);
        }
    }

    public markAsFigure() {
        this._isFigure = true;
        this._setPlacementSize();
    }

    public makeAvatarManifest(): IAssetManifest_Avatar {
        const manifest: IAssetManifest_Avatar = {
            format: 3,
            main: {
                type: "Avatar",
                skeleton: this.getAvatarSkeleton().getAssetId(),
                equipments: this.getAvatarEquipment().getAllEquipItems(),
            }
        };

        const aniItemId = this.getAvatarAnimation().getCurrentAniItemId();
        if (aniItemId) {
            manifest.main.animation = aniItemId;
        }

        const customizationData = this.getAvatarCustomization().getCustomizationData();
        if (customizationData) {
            manifest.main.customizations = customizationData;
        }
        else {
            manifest.main.customizations = undefined;
        }

        return manifest;
    }

    public refreshCustomInspectorProperties() {
        this.inspectableCustomProperties = [];
        this._refreshCustomInspectorProperties_LoadPreset(this.inspectableCustomProperties);
        this._avatarSkeleton.refreshCustomInspectorProperties(this.inspectableCustomProperties);
        this._avatarEquipment.refreshCustomInspectorProperties(this.inspectableCustomProperties);
        this._avatarAnimation.refreshCustomInspectorProperties(this.inspectableCustomProperties);
    }

    private _setPlacementSize() {
        if (this.isFigure()) {
            this._placementWidth = Constants.MYROOM_FIGURE_GRID_UNIT;
            this._placementHeight = Constants.MYROOM_FIGURE_GRID_UNIT;
            this._placementAttachType = EPlacementAttachType.Desk;
        }
        else {

            this._placementWidth = Constants.MYROOM_AVATAR_GRID_UNIT;
            this._placementHeight = Constants.MYROOM_AVATAR_GRID_UNIT;
            this._placementAttachType = EPlacementAttachType.Floor;
        }
    }

    private _refreshCustomInspectorProperties_LoadPreset(inspectableCustomProperties: BABYLON.IInspectable[]) {
        inspectableCustomProperties.push({
            label: "Load Preset (기획용)",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                BABYLON.Tools.ReadFile(file, (data) => {
                    const preset = JSON.parse(data) as IAssetManifest_Avatar;
                    if (preset) {
                        this.loadModelFromManifest(preset);
                    }
                    else {
                        console.error("AvatarController._refreshCustomInspectorProperties_LoadPreset(): failed!!");
                    }
                });
            },
            accept: ".json"
        });
    }

    public prepareLoadingAnimation() {
        const pos = this.position.clone();
        // 벽에 가려서 안보이는 부분에 배치해서 rendering을 되게끔 한다. 버벅임이 없다.
        this.position.copyFrom(new BABYLON.Vector3(20, -15, -20));
        this._initPos = pos;
    }

    public async playLoadingAnimation(waitTime: number, ease: BABYLON.EasingFunction, fps: number, totalFrame: number) {
        const animationWithPromise = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (this._initPos) {
                    setTimeout(() => {
                        if (this._initPos) BABYLON.Animation.CreateAndStartAnimation('anim', this, 'position', fps, totalFrame, new BABYLON.Vector3(this._initPos.x, this._initPos.y + 20, this._initPos.z), this._initPos, 0, ease, resolve);
                        this._initPos = null;
                    }, waitTime);
                } else {
                    resolve();
                }
            });
        };
        await animationWithPromise();
    }

    private _getHead() {
        if (!this._headNode) {
            const head = this._modelRoot.getChildTransformNodes(false, (node) => node.name == "Bip001 Head");
            if (head && head.length > 0) {
                //console.log("head", head[0].name);
                this._headNode = head[0];
            }
        }
    }

    protected _getHeight(): number {
        this._getHead();
        if (this._headNode) {
            return this._headNode.absolutePosition.y + 0.3 - this.absolutePosition.y;
        } else {
            return super._getHeight();
        }
    }

    public applyHeadRotation(head: number, pitch: number, yaw: number) {
        this._getHead();
        if (this._headNode) {
            let rot = new BABYLON.Vector3();
            rot.x = head;
            rot.y = 0;
            rot.z = pitch;

            let mat = BABYLON.Matrix.Identity();
            rot.toQuaternion().toRotationMatrix(mat);
            let matY = BABYLON.Matrix.Identity();
            BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), yaw).toRotationMatrix(matY);
            let rotQ = BABYLON.Quaternion.Identity();
            matY.multiply(mat).decompose(undefined, rotQ);

            this._headNode.rotation = rotQ.toEulerAngles();
        }
    }

    public zoomIn(zoomInCompleteFunc?: () => void): (() => void) | null | undefined {
        return this._context.getCamera()?.zoomIn(this, zoomInCompleteFunc);
    }

    public onTouch() {
    }
}