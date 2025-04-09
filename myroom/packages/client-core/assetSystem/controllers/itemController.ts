import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button as ClientButton } from '@babylonjs/gui';
import { EMediaType, IAssetLoader, eAssetType, eRoomObjectType } from "../definitions";
import { MyRoomContext } from "../myRoomContext";
import { MyRoomController } from "./myRoomController";
import { RoomOject } from "./roomSubSystem/roomObject";
import { TableDataManager } from "../../tableData/tableDataManager";
import { IMyRoomItemPlacementInfo, IMyRoomItemFunctionData } from "../jsonTypes/manifest/assetManifest_MyRoom";
import { EFuntionType } from "../../tableData/defines/System_Enum";
import { Constants } from "../constants";
//import { CSSRendererManager } from "./roomSubSystem/cssRenderer";
import youtubeImage from "../../assets/youtube.png";
import { AvatarController } from "./avatarController";
import { ItemData } from "../../tableData/defines/System_Interface";

const OPTIMIZE_VIDEO_TEXTURE = true;
const VIDEO_UPDATE_PERIOD = 67;

// todo : 
type AnimationInfo = {
    anim: string;
    chatImg?: string;
    width?: number;
    height?: number;
}

export class ItemController extends RoomOject {
    private _assetLoader: IAssetLoader;
    private _itemId: string;
    private _itemInstnaceId: string;
    private _itemFunctionData: BABYLON.Nullable<IMyRoomItemFunctionData> = null;

    private _iframePlane: BABYLON.Nullable<BABYLON.Mesh> = null;
    private _youtubeId: string | null = null;
    private _originalMtl: BABYLON.Nullable<BABYLON.Material> = null;
    // youtube와 같은 content를 바로 play할 것인지 여부.
    private _applyContent: boolean = false;
    private _onTouch?: ((itemId: string) => void);

    private _initPos: BABYLON.Vector3 | null = null;
    private _lastCloneMaterial: BABYLON.Nullable<BABYLON.Material> = null;
    private _createdTextureList: BABYLON.BaseTexture[] = [];
    private _videoTimerId: number | null = null;

    private _keepPlaceInfo: IMyRoomItemPlacementInfo | null = null;
    private _lookAtObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    private _animationGroups: BABYLON.AnimationGroup[] = [];
    private _curActionIndex: number = 0;
    private _chatMesh: BABYLON.Mesh | null = null;

    public getItemId(): string {
        return this._itemId;
    }

    public getItemInstanceId(): string {
        return this._itemInstnaceId;
    }

    public getParentItemController(): ItemController | null {
        if (!this.parent) {
            return null;
        }

        return this.parent as ItemController;
    }

    public getItemFunctionData(): BABYLON.Nullable<IMyRoomItemFunctionData> {
        return this._itemFunctionData;
    }

    public hasFunction(): boolean {
        const itemData = TableDataManager.getInstance().findItem(this._itemId);
        return itemData ? itemData.funtion !== EFuntionType.NONE : false;
    }

    // backpack에 넣을때 자신의 placeInfo를 저장하기 위한 용도. (wall이 없어 hide되면, placement에서 빠지기 때문에, make로 만들수가 없어서 저장해두는 수 밖에 없다.)
    public getKeepPlaceInfo(): BABYLON.Nullable<IMyRoomItemPlacementInfo> {
        return this._keepPlaceInfo;
    }
    public setKeepPlaceInfo(info: BABYLON.Nullable<IMyRoomItemPlacementInfo>) {
        this._keepPlaceInfo = info;
    }

    public constructor(itemInstanceId: string, itemId: string, scene: BABYLON.Nullable<BABYLON.Scene>, assetLoader: IAssetLoader, context: MyRoomContext, ownerRoom: MyRoomController | null, applyContent: boolean = false, onTouch?: (itemId: string) => void) {
        super(context, ownerRoom, eRoomObjectType.Item, `[Item] (${itemId})`, scene);

        this._ownerRoom = ownerRoom;
        this.parent = null;

        this._itemId = itemId;
        this._itemInstnaceId = itemInstanceId;
        this._assetLoader = assetLoader;
        this._applyContent = applyContent;
        this._onTouch = onTouch;

        this._setPlacementInfo();
        this._setGridInfo();

        this.onDispose = () => { this.finalize(); };

        if (this._ownerRoom) {
            this._ownerRoom.getRoomObjectCounter().registerItemController(this);
        }
    }

    public finalize() {
        this.removeFromShadowMapRenderList();
        if (this._ownerRoom) {
            this._ownerRoom.getRoomObjectCounter().unregisterItemController(this);
        }
        this._clearCreatedAssets();
        this._clearVideoTimer();
        this._clearLookAtCamera();
    }

    public async initModel() {
        const result = await this._assetLoader.loadAssetIntoScene(eAssetType.Model_glb, this._itemId, this);
        if (result.loadedObjects?.animationGroups) this._animationGroups = result.loadedObjects.animationGroups;
        // loadAssetIntoScene안에서 parent 처리함. (by ulralra)
        // result.loadedObjects.meshes.forEach(m => {
        //     if (m.parent === null) {
        //         m.parent = this;
        //     }
        // });

        this.addToShadowMapRenderList();

        // 현재 사용안함.
        //this._registerAction();

        // static media가 있을 경우 보여준다.
        this.doItemFunction(null);
    }

    public destroyWithAllChildItems() {
        const allChildItems = this.getChildTransformNodes(false, (node) => node instanceof ItemController);
        allChildItems.forEach(item => {
            if (item instanceof ItemController) {
                item.destroyWithAllChildItems();
                item.dispose();
            }
        });
        this.dispose();
    }

    public getAllChildItems(): ItemController[] {
        const result: ItemController[] = [];
        const allChildItems = this.getChildTransformNodes(false, (node) => node instanceof ItemController);
        allChildItems.forEach(item => {
            if (item instanceof ItemController) {
                result.push(item as ItemController);
            }
        });

        return result;
    }

    public getAllChildItemsForDelete(): ItemController[] {
        const result: ItemController[] = [];
        const allChildItems = this.getChildTransformNodes(true, (node) => node instanceof ItemController);
        allChildItems.forEach(item => {
            if (item instanceof ItemController) {
                result.push(item as ItemController);
            }
        });

        return result;
    }

    public getAllChildFiguresForDelete(): AvatarController[] {
        const result: AvatarController[] = [];
        const allChildFigures = this.getChildTransformNodes(true, (node) => node instanceof AvatarController);
        allChildFigures.forEach(figure => {
            if (figure instanceof AvatarController) {
                result.push(figure as AvatarController);
            }
        });

        return result;
    }

    public getItemTableData(): BABYLON.Nullable<ItemData> {
        return TableDataManager.getInstance().findItem(this._itemId);
    }

    public doItemFunction(data: IMyRoomItemFunctionData | null) {
        this._youtubeId = null;
        this._itemFunctionData = data;

        // data가 null이어도, static data를 설정해야 하므로, return제거한다. (by ulralra)
        this._clearMediaTargetMaterial();
        this._clearLookAtCamera();

        //console.log("doItemFunction", this._itemId);

        const tableData = TableDataManager.getInstance().findItem(this._itemId);
        if (tableData) {
            switch (tableData.funtion) {
                case EFuntionType.HAVELINKANDIMAGE:
                    this._doItemFunction_LoadImage(tableData.funtion_address);
                    break;

                case EFuntionType.HAVELINKANDMOVIE:
                case EFuntionType.SHOWUI3DGALLERY:
                    this._doItemFunction_CheckVideo(tableData.funtion_address);
                    break;

                case EFuntionType.LINKANDIMAGE:
                    data && data.functionData && this._doItemFunction_LoadImage(data.functionData);
                    break;

                case EFuntionType.LINKANDMOVIE:
                    data && data.functionData && this._doItemFunction_CheckVideo(data.functionData);
                    break;

                case EFuntionType.LINKANDMEDIA:
                    if (this._itemFunctionData && this._itemFunctionData.functionData) {
                        switch (this._itemFunctionData.mediaType) {
                            case EMediaType.Image:
                                this._doItemFunction_LoadImage(this._itemFunctionData.functionData);
                                break;
                            case EMediaType.Video:
                                this._doItemFunction_CheckVideo(this._itemFunctionData.functionData);
                                break;
                        }
                    }
                    break;
                case EFuntionType.NPCCHATBUBBLE:
                    this._lookAtCamera();
                    break;
            }
        }
    }

    public zoomIn(zoomInCompleteFunc?: () => void): (() => void) | null | undefined {
        return this._context.getCamera()?.zoomIn(this, zoomInCompleteFunc);
    }

    public prepareLoadingAnimation() {
        const pos = this.position.clone();
        // 벽에 가려서 안보이는 부분에 배치해서 rendering을 되게끔 한다. 버벅임이 없다.
        this.position.copyFrom(new BABYLON.Vector3(10, -7.5, -10));
        this.scaling.copyFrom(BABYLON.Vector3.One().scale(0.1));
        this._initPos = pos;
    }

    public async playLoadingAnimation(waitTime: number, ease: BABYLON.EasingFunction, fps: number, totalFrame: number) {
        const animationWithPromise = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (this._initPos) {
                    setTimeout(() => {
                        BABYLON.Animation.CreateAndStartAnimation('anim', this, 'scaling', fps, totalFrame, this.scaling, BABYLON.Vector3.One(), 0, ease);
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

    public onTouch() {
        const tableData = TableDataManager.getInstance().findItem(this._itemId);
        if (tableData && tableData.funtion === EFuntionType.NPCCHATBUBBLE) {
            console.log("onTouch", this._fixJson(tableData.funtion_address));
            this._onTouch_NPCChatBubble(JSON.parse(this._fixJson(tableData.funtion_address)));
        }
    }

    private _fixJson(str: string) {
        // First, escape any backslashes to prevent syntax errors in string values
        str = str.replace(/\\/g, '\\\\');

        // Add double quotes around keys and string values while avoiding URLs
        str = str.replace(/(\b\w+)(:)([^"\s,{}]+)/g, (match, p1, p2, p3) => {
            // // Check if p3 is a part of a URL and avoid adding double quotes in that case
            // if (p3.startsWith('http') || p3.startsWith('www')) {
            //     return `"${p1}"${p2}"${p3}"`;
            // }
            return `"${p1}"${p2}"${p3}"`;
        });

        // Correcting cases where colons inside URLs are followed by double quotes
        str = str.replace(/(https?):"\/\//g, '$1://');

        return str;
    }

    //-----------------------------------------------------------------------------------
    // 아이템 기능 관련
    //-----------------------------------------------------------------------------------
    private _doItemFunction_LoadImage(imageUrl: string) {
        if (!imageUrl) {
            console.log("_doItemFunction_LoadImage : empty url");
            return;
        }

        const targetMaterial = this._getMediaTargetMaterial();
        if (targetMaterial && targetMaterial instanceof BABYLON.PBRMaterial) {
            targetMaterial.albedoTexture = new BABYLON.Texture(imageUrl, this._scene, false, false); //기본이 뒤집히나?
            //targetMaterial.albedoTexture = new BABYLON.Texture(imageUrl, this._scene);
            this._createdTextureList.push(targetMaterial.albedoTexture);
        }
    }

    private _doItemFunction_LoadVideo(videoUrl: string) {
        if (!videoUrl) {
            console.log("_doItemFunction_LoadVideo : empty url");
            return;
        }

        const targetMaterial = this._getMediaTargetMaterial();
        if (targetMaterial && targetMaterial instanceof BABYLON.PBRMaterial) {
            const videoTexture = new BABYLON.VideoTexture("video", videoUrl, this._scene, false, true, BABYLON.VideoTexture.BILINEAR_SAMPLINGMODE, {
                autoUpdateTexture: !OPTIMIZE_VIDEO_TEXTURE,
                autoPlay: true,
                loop: true,
                muted: true,
            });
            targetMaterial.albedoTexture = videoTexture;
            targetMaterial.albedoColor = BABYLON.Color3.White();
            targetMaterial.unlit = true;
            this._createdTextureList.push(targetMaterial.albedoTexture);

            // 최적화를 위해서, 20 fps로 video texture를 update한다.
            if (OPTIMIZE_VIDEO_TEXTURE) {
                //videoTexture.video.load();
                videoTexture.video.addEventListener('loadeddata', () => {
                    console.log('video loaded');
                    videoTexture!.video.play();
                    this._clearVideoTimer();
                    this._videoTimerId = window.setInterval(() => {
                        if (!videoTexture?.video.paused) videoTexture?.updateTexture(true);
                    }, VIDEO_UPDATE_PERIOD);
                });
            }
        }
        else {
            console.error("ItemController._doItemFunction_LoadVideo() => targetMaterial null", targetMaterial);
        }
    }

    private _clearVideoTimer() {
        if (this._videoTimerId) {
            window.clearInterval(this._videoTimerId);
            this._videoTimerId = null;
        }
    }

    // youtube 인지 아닌지 체크하여, 알맞은 함수 호출
    private _doItemFunction_CheckVideo(videoUrl: string) {
        if (!videoUrl) {
            console.log("_doItemFunction_CheckVideo : empty url");
            return;
        }

        const videoId = this._getYoutubeId(videoUrl);
        console.log("_doItemFunction_CheckVideo", videoId);
        if (videoId) {
            this._youtubeId = videoId;
            // youtube link일 경우, 우선 thumbnail만 보여주고, touch시 play한다.
            if (this._applyContent) {
                this._createYoutubePlane();
            } else {
                this._doItemFunction_LoadImage(this._getYoutubeThumbnail(videoId));
            }
            //this._testCode();
        } else {
            this._doItemFunction_LoadVideo(videoUrl);
        }
    }

    private _getMediaTargetMaterial(): BABYLON.Nullable<BABYLON.Material> {
        const mesh = this._getMediaTargetMesh();
        if (mesh && mesh.material) {
            if (this._originalMtl === null) {
                this._originalMtl = mesh.material;
            }

            const cloneMtl = mesh.material?.clone(mesh.material.name);
            mesh.material = cloneMtl;
            this._lastCloneMaterial = cloneMtl;
            return cloneMtl;
        }
        else {
            console.error("ItemController._getMediaTargetMaterial(): no media target mesh", this._itemId);
        }

        return null;
    }

    private _clearMediaTargetMaterial() {
        const mesh = this._getMediaTargetMesh();
        if (mesh && this._originalMtl) {
            mesh.material = this._originalMtl;
            this._originalMtl = null;
        }
        this._clearCreatedAssets();
    }

    private _clearCreatedAssets() {
        if (this._lastCloneMaterial) {
            this._lastCloneMaterial.dispose();
            this._lastCloneMaterial = null;
        }

        if (this._createdTextureList.length > 0) {
            this._createdTextureList.forEach(texture => {
                texture.dispose();
            });
            this._createdTextureList.length = 0;
        }
    }

    private _lookAtCamera() {
        let destRot: BABYLON.Vector3 | null = null;
        let lastRot: BABYLON.Vector3 | null = null;
        const heads = this.getChildTransformNodes(false, (node) => node.name == "Bip001 Head");
        let headNode: BABYLON.TransformNode | null = null;
        if (heads && heads.length > 0) headNode = heads[0];
        this._lookAtObserver = this._scene?.onBeforeRenderObservable.add(() => {
            // 카메라의 global position을 바라보게끔 headNode의 y축을 회전시킨다.
            const camera = this._context.getCamera()?.getBabylonCamera();
            if (headNode && camera) {
                const headPos = headNode.getAbsolutePosition();
                const camPos = camera.globalPosition;
                const dir = camPos.subtract(headPos);
                const rotH = Math.atan2(dir.x, dir.z);
                const rotV = Math.atan2(dir.y, new BABYLON.Vector3(dir.x, 0, dir.z).length());

                const offsetRot = this.rotationQuaternion?.toEulerAngles().y || 0;
                const curRotH = Math.max(-Math.PI * 50 / 180, Math.min(Math.PI * 50 / 180, -rotH + offsetRot));
                const curRotV = Math.min(-Math.PI * 10 / 180, Math.max(-Math.PI * 35 / 180, -rotV));

                const vec = headNode.rotation.clone();
                vec.x = curRotH;

                let mat = BABYLON.Matrix.Identity();
                vec.toQuaternion().toRotationMatrix(mat);
                let matY = BABYLON.Matrix.Identity();
                BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), curRotV).toRotationMatrix(matY);
                let rotQ = BABYLON.Quaternion.Identity();
                matY.multiply(mat).decompose(undefined, rotQ);

                destRot = rotQ.toEulerAngles();

                if (!lastRot) lastRot = headNode.rotation.clone();

                lastRot = BABYLON.Vector3.Lerp(lastRot, destRot, 0.05);
                headNode.rotation = lastRot.clone();
            }
        });
    }

    private _clearLookAtCamera() {
        if (this._lookAtObserver) {
            this._scene?.onBeforeRenderObservable.remove(this._lookAtObserver);
            this._lookAtObserver = null;
        }
    }

    private _onTouch_NPCChatBubble(animationInfo: AnimationInfo[]) {
        if (animationInfo.length === 0) return;

        const idleAnim = animationInfo[0].anim;
        this._stopAnim(animationInfo[this._curActionIndex].anim);

        this._curActionIndex = (this._curActionIndex + 1) % animationInfo.length;
        console.log("pick Avatar", this._curActionIndex);

        const info = animationInfo[this._curActionIndex];
        if (info.anim === idleAnim) {
            this._playAnim(idleAnim, true);
        } else {
            this._playAnim(info.anim, false, false, () => {
                this._playAnim(idleAnim, true);

                if (this._chatMesh) {
                    this._chatMesh.dispose();
                    this._chatMesh = null;
                }
            });
        }

        if (this._chatMesh) {
            this._chatMesh.dispose();
            this._chatMesh = null;
        }
        if (info.chatImg && info.width && info.height) {
            const scale = 4;
            this._chatMesh = this._createChat(info.chatImg, new BABYLON.Vector3(0, 1, 0), 1, 1, 1, (info.width * scale) + 'px', (info.height * scale) + 'px');
            //createParticle(pickBox.absolutePosition, 1000);
        }
    }

    //-----------------------------------------------------------------------------------
    // private animation ref
    //-----------------------------------------------------------------------------------
    private _playAnim(animName: string, loop: boolean, blending?: boolean, finishAction?: (() => void) | undefined) {
        const anim = this._animationGroups.find((anim) => anim.name === animName);
        if (anim) {
            anim.stop();

            if (blending) {
                for (let ta of anim.targetedAnimations) {
                    ta.animation.enableBlending = true;
                    ta.animation.blendingSpeed = 0.1;
                }
            }

            anim.start(loop, 1.0, anim.from, anim.to, false);
            if (finishAction) {
                anim.onAnimationEndObservable.add(() => {
                    finishAction();
                });
            }
        }
    };
    private _stopAnim(animName: string) {
        this._animationGroups.find((anim) => anim.name === animName)?.stop();
    }

    private _createChat(imageUrl: string, offset: BABYLON.Vector3, size: number, width: number, height: number, btnWidth: string | number, btnHeight: string | number): BABYLON.Mesh {
        const plane = BABYLON.MeshBuilder.CreatePlane('chat', {
            size: size,
            width: width,
            height: height,
        }, this._scene);
        //plane.parent = parent;
        plane.position = this.getBoundingInfo().boundingBox.centerWorld.clone();
        plane.position.x += offset.x;
        plane.position.y += offset.y;
        plane.position.z += offset.z;
        plane.scaling = new BABYLON.Vector3(1, 1, 1);
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        plane.isPickable = false;
        plane.checkCollisions = false;
        // if (highlightLayer) {
        //     highlightLayer.addExcludedMesh(plane);
        // }

        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);

        var button1 = ClientButton.CreateImageOnlyButton('but1', imageUrl);
        button1.width = btnWidth;
        button1.height = btnHeight;
        button1.color = '#00000000';

        advancedTexture.addControl(button1);
        return plane;
    };

    //-----------------------------------------------------------------------------------
    // private helpers
    //-----------------------------------------------------------------------------------
    private _registerAction() {
        this.getChildMeshes().forEach(m => {
            if (m) {
                m.actionManager = new BABYLON.ActionManager(this._scene);
                m.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLongPressTrigger, () => {
                    this._ownerRoom?.getInputHandler_PlaceMode().onItemLongPressed(this);
                }));
            }
        });

    }

    private _setPlacementInfo() {
        const tableData = TableDataManager.getInstance().findItem(this._itemId);
        if (tableData) {
            this._placementWidth = tableData.sw;
            this._placementHeight = tableData.sh;
            this._placementAttachType = tableData.placement_attach_type;
        }
    }

    private _setGridInfo() {
        const tableData = TableDataManager.getInstance().findItem(this._itemId);
        if (tableData && tableData.useGrids.length > 0) {
            tableData.useGrids.forEach(gridName => {
                const gridData = TableDataManager.getInstance().findItemGrid(gridName);
                if (gridData) {
                    this.addGridInfo({ gridSizeWidth: gridData.gridWidth, gridSizeHeight: gridData.gridHeight, gridOrigin: BABYLON.Vector3.FromArray(gridData.gridOrigin), gridMarkArray: gridData.gridMarkArray });
                }
                else {
                    console.error(`ItemController::_setGridInfo() Failed to find grid data. gridName='${gridName}', itemId=${this._itemId}`);
                }
            });
        }
    }

    //-----------------------------------------------------------------------------------
    // youtube 관련 함수
    //-----------------------------------------------------------------------------------
    private _getMediaTargetMesh(): BABYLON.Nullable<BABYLON.AbstractMesh> {
        const childMeshes = this.getChildMeshes();
        for (let ii = 0; ii < childMeshes.length; ++ii) {
            if (childMeshes[ii].material) {
                if (childMeshes[ii].material!.name === Constants.ROOMOBJECT_FUNCTION_IMAGE_TARGET_MATERIAL_NAME) {
                    //console.log(">>>>>>>>>>>>>>>>>>>", childMeshes[ii].material);
                    return childMeshes[ii];
                }
            }
        }

        return null;
    }

    //@ts-ignore
    private _createYoutubePlane() {
        if (this._youtubeId) {
            const targetMesh = this._getMediaTargetMesh();
            if (targetMesh instanceof BABYLON.Mesh) {

                this._disposeYoutubePlane();

                console.log("_createYoutubePlane", this._youtubeId);
                const posData = this._calcPlanePos(targetMesh);
                this._iframePlane = this._context.getCSSRendererManager().createYoutubeCSSPlane(this._scene, this._youtubeId, posData[0], posData[1], posData[2]);
                if (this._iframePlane) {
                    this._iframePlane.parent = targetMesh;
                    this._iframePlane.position = posData[0];
                    this._iframePlane.rotation = posData[1];
                    this._iframePlane.scaling = posData[2];

                    // touch event 등록
                    this._iframePlane.actionManager = new BABYLON.ActionManager(this._scene);
                    this._iframePlane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                        console.log("iframePlane touched");
                        this._onTouch?.(this._itemId);
                    }));
                }
            }
        }
    }

    private _disposeYoutubePlane() {
        if (this._iframePlane) {
            this._iframePlane.dispose();
            this._iframePlane = null;

            console.log("_disposeYoutubePlane");
        }
    }

    // 이 mesh는 4개 vertex로 가정하고, 모든 normal이 같다고 가정한다. 그래야 css plane을 설정할 수 있다.
    private _calcPlanePos(mesh: BABYLON.Mesh): [BABYLON.Vector3, BABYLON.Vector3, BABYLON.Vector3] {
        const pos = mesh.getPositionData();
        const norm = mesh.getNormalsData();
        if (!pos || !norm) return [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.One()];

        //console.log("pos", mesh.getPositionData());

        // pos 계산
        let center = BABYLON.Vector3.Zero();
        const totalVert = pos.length / 3;
        for (let i = 0; i < totalVert; i++) {
            center.x += pos[i * 3 + 0];
            center.y += pos[i * 3 + 1];
            center.z += pos[i * 3 + 2];
        }
        center = center.scale(1 / totalVert);
        // 모든 vertex의 normal은 같으므로, 1번째 vertex의 normal을 face normal 으로 설정한다.
        const normal = new BABYLON.Vector3(norm[0], norm[1], norm[2]).normalize();

        // scale 계산
        let scaleVec = new BABYLON.Vector3(pos[0] - center.x, pos[1] - center.y, pos[2] - center.z).scale(2);
        // 우선 축을 계산한다.
        const initAxis = new BABYLON.Vector3(1, 0, 0);
        let xAxis, yAxis;
        if (BABYLON.Vector3.Dot(scaleVec, initAxis) < 1) {
            yAxis = BABYLON.Vector3.Cross(normal, initAxis);
        } else {
            yAxis = new BABYLON.Vector3(0, 1, 0);
        }
        xAxis = BABYLON.Vector3.Cross(yAxis, normal);
        // 그 축으로 project하여 길이를 잰다.
        const scaleX = Math.abs(BABYLON.Vector3.Dot(xAxis, scaleVec));
        const scaleY = Math.abs(BABYLON.Vector3.Dot(yAxis, scaleVec));
        const scale = new BABYLON.Vector3(scaleX, scaleY, 1);

        // rot 계산
        let rot = BABYLON.Vector3.Zero();
        const forward = new BABYLON.Vector3(0, 0, -1);
        const dot = BABYLON.Vector3.Dot(normal, forward);
        const angle = Math.acos(dot);
        if (dot > 0.99) {
            rot = BABYLON.Vector3.Zero();
        } else if (dot < -0.99) {
            rot = new BABYLON.Vector3(0, Math.PI, 0);
        } else {
            const axis = BABYLON.Vector3.Cross(forward, normal);
            rot = BABYLON.Quaternion.RotationAxis(axis, angle).toEulerAngles();
        }
        const SLIGHT_UP_VALUE = 0.01;
        center = center.add(normal.scale(SLIGHT_UP_VALUE));

        //console.error("pos", [center, rot, pos, scale, scaleVec, xAxis, yAxis]);

        return [center, rot, scale];
    }

    // https://www.youtube.com/watch?v=YOUR_VIDEO_ID
    // https://youtu.be/YOUR_VIDEO_ID
    // https://www.youtube.com/embed/YOUR_VIDEO_ID
    private _getYoutubeId(videoUrl: string): string | null {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})/;
        const match = videoUrl?.match(regex);
        return match ? match[1] : null;
    }
    //@ts-ignore
    private _getYoutubeThumbnail(videoId: string): string {
        return youtubeImage; //"https://img.youtube.com/vi/" + videoId + "/default.jpg";
    }

    // private _testCode() {
    //     this._scene?.onKeyboardObservable.add((kbInfo) => {
    //         switch (kbInfo.type) {
    //             case BABYLON.KeyboardEventTypes.KEYDOWN:
    //                 if (kbInfo.event.key == '1') {
    //                     //this._disposeYoutubePlane();
    //                     void Promise.all([
    //                         import("@babylonjs/core/Debug/debugLayer"),
    //                         import("@babylonjs/inspector"),
    //                     ]).then((_values) => {
    //                         this._scene.debugLayer.show({
    //                             handleResize: true,
    //                             overlay: true,
    //                             globalRoot: document.getElementById("#root") || undefined,
    //                         });
    //                     });

    //                 } else if (kbInfo.event.key == '2') {
    //                     this._createYoutubePlane();
    //                 } else if (kbInfo.event.key == '3') {
    //                     this._disposeYoutubePlane();
    //                 }
    //                 break;
    //         }
    //     });
    // }

}