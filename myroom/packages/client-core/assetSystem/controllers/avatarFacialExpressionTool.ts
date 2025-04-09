import * as BABYLON from "@babylonjs/core";
import { IAssetLoader } from "../definitions";
import { AvatarController } from "./avatarController";
import { MyRoomContext } from "../myRoomContext";
import { IAssetManifest_Avatar } from "../jsonTypes/manifest/assetManifest_Avatar";
import { EFacialParts } from "./avatarSubSystem/avatarFacialExpression";

export class AvatarFacialExpressionTool extends BABYLON.TransformNode
{
    public static readonly SETUP_NODE_NAME: string = "아바타 표정";

    private _roomContext: MyRoomContext;
    private _assetLoader: IAssetLoader;
    private _avatarController: AvatarController;

    // private _loadAvatarId: string = "34aDyVneHDnaCDEY6gW9Me";
    // get loadAvatarId() { return this._loadAvatarId; }
    // set loadAvatarId(value) { this._loadAvatarId = value; }

    public constructor(scene: BABYLON.Nullable<BABYLON.Scene>, assetLoader: IAssetLoader, roomContext: MyRoomContext)
    {
        super(AvatarFacialExpressionTool.SETUP_NODE_NAME, scene);
        
        this._roomContext = roomContext;
        this._assetLoader = assetLoader;
        this._avatarController = new AvatarController("Mannequin", this.getScene(), this._assetLoader, this._roomContext, null);
        
        const manifest: IAssetManifest_Avatar = {
            format: 3,
            main: {
                type: "Avatar",
                skeleton: "IrvHeMEb6fGZbkOrEdr0a",
                equipments:[
                    "Kkuqwv0vvC6QsslKzYu8m"
                 ],
                 animation:"MduIYato3xRxzdZ74OZEm"
            }
        };
        this._avatarController.loadModelFromManifest(manifest);

        this.inspectableCustomProperties = [];
        this._createCustomProperies_Panel();
    }

    private _createCustomProperies_Panel()
    {
        this.inspectableCustomProperties.push(
            {
                label: "enable facial expression",
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: async () => {
                    await this._avatarController.getAvatarFacialExpression().enableFacialExpression();
                },
            })
        this.inspectableCustomProperties.push(
            {
                label: "disable facial expression",
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: async () => {
                    await this._avatarController.getAvatarFacialExpression().disableFacialExpression();
                },
            })

        this.inspectableCustomProperties.push(
            {
                label: "표정 슬라이드",
                propertyName: "",
                type: BABYLON.InspectableType.Tab,
            });

        Object.values(EFacialParts).forEach(facialPartKey => {
            this.inspectableCustomProperties.push({
                label: facialPartKey,
                propertyName: facialPartKey,
                type: BABYLON.InspectableType.Slider,
            });
        
            this._avatarController?.getAvatarFacialExpression()?.setFactor(facialPartKey, 0);
        
            Object.defineProperty(this, facialPartKey, {
                get: function() {
                    return this._avatarController?.getAvatarFacialExpression()?.getFactor(facialPartKey);
                },
                set: function(value: number) {
                    this._avatarController?.getAvatarFacialExpression()?.setFactor(facialPartKey, value);
                }
            });
        });
    }
}