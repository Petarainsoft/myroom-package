import * as BABYLON from "@babylonjs/core";
import { MyRoomController } from "../myRoomController";
import { IAssetLoader } from "../../definitions";
import { IOutsideFigureInfo } from "../../jsonTypes/manifest/assetManifest_MyRoom";
import { AvatarController } from "../avatarController";
import { TableDataManager } from "../../../tableData/tableDataManager";
import { ItemController } from "../itemController";
import { Constants } from "../../constants";
import { ConstantsEx } from "../../constantsEx";

const OFFSET_Y = -0.2;
export class OutsidePlacementManager {
    private _owner: MyRoomController;
    private _assetLoader: IAssetLoader;
    private _scene: BABYLON.Scene;

    private _allItems: Map<string, ItemController> = new Map<string, ItemController>();
    private _allFigures: Map<string, AvatarController> = new Map<string, AvatarController>();

    private _shadowFloor: BABYLON.Mesh | null = null;
    private _shadowFloorMaterial: BABYLON.Material | null = null;
    private _mirrorTexture: BABYLON.MirrorTexture | null = null;
    private static _shaderChanged: boolean = false;

    constructor(owner: MyRoomController, assetLoader: IAssetLoader) {
        this._owner = owner;
        this._assetLoader = assetLoader;
        this._scene = this._owner._scene;
    }

    public finalize() {
        this._allItems.forEach((c) => { c.dispose(); });
        this._allItems.clear();

        this._allFigures.forEach((c) => { c.dispose(); });
        this._allFigures.clear();

        this._disposeFloor();
    }
    private _disposeFloor() {
        this._shadowFloor?.dispose();
        this._shadowFloor = null;

        this._shadowFloorMaterial?.dispose();
        this._shadowFloorMaterial = null;

        this._mirrorTexture?.dispose();
        this._mirrorTexture = null;
    }

    public beforeChangeRoomSkin() {
    }
    public afterChangeRoomSkin() {
        this._allItems.forEach((c) => {
            c.addToShadowMapRenderList();
        });
        this._allFigures.forEach((c) => {
            c.addToShadowMapRenderList();
        });
    }

    public initialize() {
        this._disposeFloor();

        if (this._owner.getServiceType() === ConstantsEx.SERVICE_JOYSAM || this._owner.getServiceType() === ConstantsEx.SERVICE_KH) this._createFloorForMirror();
        else this._createFloorForShadow();
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


    //-----------------------------------------------------------------------------------
    // Figure 배치
    //-----------------------------------------------------------------------------------
    public async placeFigures(_figures: IOutsideFigureInfo[]): Promise<void> {
        this.removeAllFigures();

        const ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        const posList = TableDataManager.getInstance().getOutSidePos(_figures.length);
        for (let ii = 0; ii < _figures.length && ii < posList.length; ++ii) {
            const info = _figures[ii];

            const avatarController = new AvatarController(info.avatarId, this._scene, this._assetLoader, this._owner.getRoomContext(), this._owner, true);
            avatarController.markAsFigure();

            avatarController.setAbsolutePosition(new BABYLON.Vector3(posList[ii].X, posList[ii].Y + OFFSET_Y, posList[ii].Z));

            // 45도와 -45중에 랜덤으로 하나의 각도를 설정한다.
            avatarController.rotation = new BABYLON.Vector3(0, Math.random() > 0.5 ? -Math.PI / 2 : 0, 0);

            this._allFigures.set(info.avatarId, avatarController);

            // 한번에 로딩하면, single thread에서 버벅일 수 있으므로, 하나씩 로딩한다.
            if (Constants.PLAY_LOADING_ANIMATION_OUTSIDE) avatarController.prepareLoadingAnimation();

            await avatarController.initModel();

            if (Constants.PLAY_LOADING_ANIMATION_OUTSIDE) await avatarController.playLoadingAnimation(0, ease, Constants.PLAY_LOADING_ANIMATION_SPEED, Constants.PLAY_LOADING_FRAME);
        }
    }

    public removeFigure(figureId: string, distroy: boolean = true) {
        const avatarController = this._allFigures.get(figureId);
        if (distroy && avatarController) {
            avatarController.dispose();
        }
        this._allFigures.delete(figureId);
        console.log(`====> removed figure ${figureId}`);
    }

    public removeAllFigures() {
        this._allFigures.forEach((c) => { c.dispose(); });
        this._allFigures.clear();
    }

    private _createFloorForShadow() {
        // 반사 바닥 추가
        const boundings = this._owner.getBoundingInfo();
        const center = boundings.boundingBox.centerWorld;
        const size = boundings.boundingBox.extendSizeWorld;
        //console.error("boundings", boundings);
        const EMPTY_SPACE = 4;
        // 반사 바닥 추가
        const mesh = BABYLON.MeshBuilder.CreatePlane(
            'floor',
            { width: size.x * 2 + EMPTY_SPACE, height: size.z * 2 + EMPTY_SPACE },
            this._scene,
        );
        mesh.rotation = new BABYLON.Vector3(Math.PI * 0.5, 0, 0);
        mesh.position = new BABYLON.Vector3(center.x, OFFSET_Y, center.z);
        mesh.receiveShadows = true;
        //mesh.visibility = 0.5;

        this._shadowFloor = mesh;

        var backgroundMaterial = new BABYLON.BackgroundMaterial("backgroundMaterial", this._scene);
        backgroundMaterial.alpha = -0.01;
        backgroundMaterial.primaryColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        if (!OutsidePlacementManager._shaderChanged) {
            OutsidePlacementManager._shaderChanged = true;

            BABYLON.Effect.ShadersStore["backgroundPixelShader"] =
                BABYLON.Effect.ShadersStore["backgroundPixelShader"].replace(
                    "gl_FragColor=color;",
                    "gl_FragColor=vec4(0., 0., 0., (1.0 - clamp(globalShadow, 0., 1.)) * 0.4);");
        }
        mesh.material = backgroundMaterial;
        this._shadowFloorMaterial = backgroundMaterial;
    }

    private _createFloorForMirror() {
        const boundings = this._owner.getBoundingInfo();
        const center = boundings.boundingBox.centerWorld;
        const size = boundings.boundingBox.extendSizeWorld;
        //console.error("boundings", boundings);
        const EMPTY_SPACE = 4;
        // 반사 바닥 추가
        const mesh = BABYLON.MeshBuilder.CreatePlane(
            'floor',
            { width: size.x * 2 + EMPTY_SPACE, height: size.z * 2 + EMPTY_SPACE },
            this._scene,
        );
        mesh.rotation = new BABYLON.Vector3(Math.PI * 0.5, 0, 0);
        mesh.position = new BABYLON.Vector3(center.x, -0.47, center.z);
        mesh.receiveShadows = true;
        mesh.visibility = 0.5;

        this._shadowFloor = mesh;

        if (mesh && this._scene) {
            const material = new BABYLON.PBRMaterial("floor", this._scene);
            //material.albedoTexture = new Texture(FOLDER + 'floor_tile.jpg', scene);
            material.albedoColor = new BABYLON.Color3(162 / 255, 162 / 255, 162 / 255);
            material.roughness = 0.7;

            const mirrorTex = new BABYLON.MirrorTexture(
                'mirror',
                { width: 2048, height: 2048 },
                this._scene,
                true,
            );
            mirrorTex.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
            mirrorTex.renderList = null;
            mirrorTex.level = 1;

            material.reflectionTexture = mirrorTex;
            material.reflectionColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            material.emissiveColor = new BABYLON.Color3(0, 0, 0);

            mesh.material = material;

            this._shadowFloorMaterial = material;
            this._mirrorTexture = mirrorTex;
        }
    }

}