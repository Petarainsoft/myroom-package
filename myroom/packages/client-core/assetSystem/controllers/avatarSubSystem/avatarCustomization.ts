import * as BABYLON from "@babylonjs/core";
import { AvatarController } from "../avatarController";
import { EItemCategory3 } from "../../../tableData/defines/System_Enum";
import { AvatarEquipment } from "./avatarEquipment";
import { Constants } from "../../../assetSystem/constants";

export class AvatarCustomization {
    private _owner: AvatarController;

    private _skinColor: string = "";
    private _hairColor: string = "";
    private _faceMakeupTextureId: string = "";

    public getSkinColor(): string {
        return this._skinColor;
    }

    public getHairColor(): string {
        return this._hairColor;
    }

    public getFaceMakeupTextureId(): string {
        return this._faceMakeupTextureId;
    }

    public getCustomizationData(): any {
        const skinColor = this.getSkinColor();
        const hairColor = this.getHairColor();
        const faceMakeupTextureId = this.getFaceMakeupTextureId();

        if (skinColor || hairColor || faceMakeupTextureId) {
            const data: any = {};
            if (skinColor) {
                data.skinColor = skinColor;
            }

            if (hairColor) {
                data.hairColor = hairColor;
            }

            if (faceMakeupTextureId) {
                data.faceMakeupTextureId = faceMakeupTextureId;
            }

            return data;
        }

        return undefined;
    }

    public constructor(owner: AvatarController) {
        this._owner = owner;
    }

    public finalize() {

    }

    public applyAvatarCustomization(customizationData: any) {
        if (customizationData) {
            customizationData.skinColor && this.setSkinColor(customizationData.skinColor);
            customizationData.hairColor && this.setHairColor(customizationData.hairColor);
        }
    }

    public setSkinColor(hexColor: string) {
        if (hexColor !== "") {
            this._skinColor = hexColor;
            const materials = this._getTargetMaterial(EItemCategory3.CLOTHES);
            if (materials) {
                materials.forEach(mat => {
                    const inputBlock = mat.getInputBlockByPredicate((b) => { return b.name === Constants.FIGURE_CUSTOMIZATION_SKINCOLOR_NAME; });
                    if (inputBlock) {
                        inputBlock.value = BABYLON.Color3.FromHexString(hexColor);
                    }
                    else {
                        console.error("AvatarCustomization.setSkinColor() - inputBlock is null");
                    }
                });
            }
        }
    }

    public setHairColor(hexColor: string) {
        if (hexColor !== "") {
            this._hairColor = hexColor;
            //Body의 hair 부분 적용
            const bodyHairMaterials = this._getTargetMaterial(EItemCategory3.CLOTHES);
            if (bodyHairMaterials) {
                bodyHairMaterials.forEach(mat => {
                    const inputBlock = mat.getInputBlockByPredicate((b) => { return b.name === Constants.FIGURE_CUSTOMIZATION_HAIRCOLOR_NAME; });
                    if (inputBlock) {
                        inputBlock.value = BABYLON.Color3.FromHexString(hexColor);
                    }
                    else {
                        console.error("AvatarCustomization.setHairColor() - inputBlock is null");
                    }
                });
            }


            //Hair 메쉬 적용
            const hairMaterials = this._getTargetMaterial(EItemCategory3.HAIR);
            if (hairMaterials) {
                hairMaterials.forEach(mat => {
                    const inputBlock = mat.getInputBlockByPredicate((b) => { return b.name === Constants.FIGURE_CUSTOMIZATION_HAIRCOLOR_NAME; });
                    if (inputBlock) {
                        inputBlock.value = BABYLON.Color3.FromHexString(hexColor);
                    }
                    else {
                        console.error("AvatarCustomization.setHairColor() - inputBlock is null");
                    }
                });
            }
        }
    }

    public setFaceMakeupTexture(assetId: string) {
        //추후 구현 필요
    }

    private _getTargetMaterial(itemCategory: EItemCategory3): BABYLON.NodeMaterial[] | null {
        const equipment = this._owner.getAvatarEquipment();
        if (equipment) {
            const slotName = AvatarEquipment.getSlotNameByCategory3(itemCategory);
            if (slotName) {
                const materials: BABYLON.NodeMaterial[] = [];
                const meshes = equipment.getEquipMeshes(slotName);
                if (meshes.length > 0) {
                    meshes.forEach(mesh => {
                        const mat = mesh.material;
                        if (mat instanceof BABYLON.NodeMaterial) {
                            materials.push(mat);
                        }
                    });
                }
                return materials;
            }
        }
        return null;
    }

    private _setColorToMaterial(material: BABYLON.NodeMaterial, colorName: string, hexColor: string) {
        const inputBlock = material.getInputBlockByPredicate((b) => { return b.name === colorName; });
        if (inputBlock) {
            inputBlock.value = BABYLON.Color3.FromHexString(hexColor);
        }
        else {
            console.error(`AvatarCustomization._setColorToMaterial() - inputBlock is null, colorName: ${colorName}`);
        }
    }
}