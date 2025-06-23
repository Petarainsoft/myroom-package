import * as BABYLON from '@babylonjs/core';
import { ENodeMaterialType, IMaterialData_Node, IMaterialData_PBR, IPBRMaterialData_LightingAndColor, IPBRMaterialData_MetallicWorkflow, IPBRMaterialData_OverwriteTextures } from '../jsonTypes/manifest/assetManifest_Material';

import materialJson_Avatar from "../../assets/nodeMaterials/AvatarSkinNodeMaterial.json";
import materialJson_Water from "../../assets/nodeMaterials/MyroomSkinWaterNodeMaterial.json";
import { IAssetPackageFileLoader, eAssetType } from '../definitions';

export class MaterialManager {
    private _scene: BABYLON.Scene;
    private _sourceMaterials: Map<string, BABYLON.NodeMaterial> = new Map<string, BABYLON.NodeMaterial>();

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
        this._makeAllSourceMaterials();
    }

    public finalize() {
        this._sourceMaterials.forEach((m) => {
            m.dispose();
        });
        this._sourceMaterials.clear();
    }

    public async makeNodeCloneMaterial(mtlType: ENodeMaterialType, mtlName: string = "", changeData: IMaterialData_Node | undefined = undefined, packageFileLoader: IAssetPackageFileLoader | null = null, assetId: string | undefined = undefined): Promise<BABYLON.NodeMaterial | undefined> {
        const sourceMaterial = this._sourceMaterials.get(mtlType);
        if (sourceMaterial) {
            const material = this._sourceMaterials.get(mtlType)?.clone(mtlName || sourceMaterial.name + "_clone", true);
            if (material && changeData) {
                //common Data 적용
                if (changeData.commonData) {
                    if (changeData.commonData.depthFunction) {
                        material.depthFunction = changeData.commonData.depthFunction;
                    }
                    if (changeData.commonData.needDepthPrePass !== undefined) {
                        material.needDepthPrePass = changeData.commonData.needDepthPrePass;
                    }

                    material.alpha = changeData.commonData.alpha;
                    material.transparencyMode = changeData.commonData.transparencyMode;
                    material.alphaMode = changeData.commonData.alphaMode;
                }

                //Input Value 적용
                changeData.inputValues.forEach((input: any) => {
                    const value = material.getInputBlockByPredicate((b) => { return b.name === input.name; /*&& b.uniqueId === input.id;*/ });
                    if (value) {

                        if (input.valueType === "number") {
                            value.value = input.value;
                        }
                        else if (input.valueType === "BABYLON.Vector2") {
                            value.value = BABYLON.Vector2.FromArray(input.value);
                        }
                        else if (input.valueType === "BABYLON.Vector3") {
                            value.value = BABYLON.Vector3.FromArray(input.value);
                        }
                        else if (input.valueType === "BABYLON.Vector4") {
                            value.value = BABYLON.Vector4.FromArray(input.value);
                        }
                        else if (input.valueType === "BABYLON.Color3") {
                            value.value = BABYLON.Color3.FromArray(input.value);
                        }
                        else if (input.valueType === "BABYLON.Color4") {
                            value.value = BABYLON.Color4.FromArray(input.value);
                        }
                        else if (input.valueType === "BABYLON.Matrix") {
                            value.value = BABYLON.Matrix.FromArray(input.value);
                        }
                        else {
                            console.error(`Not handled Input Value  : ${value.type} , inputName : ${input.name} inputvalue : ${input.value}`);
                        }
                    }
                });

                //Texture 적용
                if (packageFileLoader && assetId) {
                    const processes = [];
                    for (let t = 0; t < changeData.textures.length; t++) {
                        const texture = changeData.textures[t];
                        const textureBlocks = material.getTextureBlocks();
                        const texblock = textureBlocks.find((b) => { return b.name === texture.name; /*&& b.uniqueId === texture.id;*/ });
                        if (texblock) {
                            const process = async () => {
                                const imageName = `${material.name}_${texblock.name}`;

                                const imageUrl = await packageFileLoader.loadFile(eAssetType.Model_glb, assetId, imageName + ".ktx2");
                                const texture = new BABYLON.Texture(imageUrl, this._scene, false, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ".ktx2");

                                //const imageUrl = await packageFileLoader.loadFile(eAssetType.Model_glb, assetId, imageName + ".png");
                                //const texture = new BABYLON.Texture(imageUrl, this._scene, false, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ".png");

                                texture.name = imageName;
                                texblock.texture = texture;
                            };
                            processes.push(process());
                        }
                    }
                    if (processes.length > 0) await Promise.all(processes);
                }
            }

            return material;
        }
        else {
            console.error(`NodeMaterialManager.makeCloneMaterial() : not found source material for type(${mtlType})`);
        }

        return undefined;
    }

    public async modifyPBRMaterial(material: BABYLON.PBRMaterial, data: IMaterialData_PBR, packageFileLoader: IAssetPackageFileLoader | null = null, assetId: string | undefined = undefined) {
        if (material && data) {

            //common Data 적용
            if (data.commonData.depthFunction) {
                material.depthFunction = data.commonData.depthFunction;
            }
            if (data.commonData.needDepthPrePass !== undefined) {
                material.needDepthPrePass = data.commonData.needDepthPrePass;
            }
            material.alpha = data.commonData.alpha;
            material.transparencyMode = data.commonData.transparencyMode;
            material.alphaMode = data.commonData.alphaMode;

            //LightingAndColor
            const lightingAndColorData: IPBRMaterialData_LightingAndColor = data.lightingAndColorData as IPBRMaterialData_LightingAndColor;
            material.albedoColor = BABYLON.Color3.FromArray(lightingAndColorData.albedoColor);
            material.reflectivityColor = BABYLON.Color3.FromArray(lightingAndColorData.reflectivityColor);
            material.microSurface = lightingAndColorData.microSurface;
            material.emissiveColor = BABYLON.Color3.FromArray(lightingAndColorData.emissiveColor);
            material.ambientColor = BABYLON.Color3.FromArray(lightingAndColorData.ambientColor);
            material.usePhysicalLightFalloff = lightingAndColorData.usePhysicalLightFalloff;

            //IPBRMaterialData_MetallicWorkflow
            const metalicWorkflowData: IPBRMaterialData_MetallicWorkflow = data.metalicWorkflowData as IPBRMaterialData_MetallicWorkflow;
            material.metallic = metalicWorkflowData.metallic;
            material.roughness = metalicWorkflowData.roughness;
            material.indexOfRefraction = metalicWorkflowData.indexOfRefraction;
            material.metallicF0Factor = metalicWorkflowData.F0Factor;
            material.metallicReflectanceColor = BABYLON.Color3.FromArray(metalicWorkflowData.reflectanceColor);

            //OverwriteTextures 적용
            const overwriteTexturesData: IPBRMaterialData_OverwriteTextures = data.overwriteTextures as IPBRMaterialData_OverwriteTextures;
            overwriteTexturesData.useAlbedoTexture && (material.albedoTexture = await this._makeOverwriteTexture(material.name, "Albedo", packageFileLoader, assetId));
            overwriteTexturesData.useMetallicTexture && (material.metallicTexture = await this._makeOverwriteTexture(material.name, "Metallic", packageFileLoader, assetId));
            overwriteTexturesData.useReflectionTexture && (material.reflectionTexture = await this._makeOverwriteTexture(material.name, "Reflection", packageFileLoader, assetId));
            overwriteTexturesData.useRefractionTexture && (material.refractionTexture = await this._makeOverwriteTexture(material.name, "Refraction", packageFileLoader, assetId));
            overwriteTexturesData.useReflectivityTexture && (material.reflectivityTexture = await this._makeOverwriteTexture(material.name, "Reflectivity", packageFileLoader, assetId));
            overwriteTexturesData.useMicroSurfaceTexture && (material.microSurfaceTexture = await this._makeOverwriteTexture(material.name, "MicroSurface", packageFileLoader, assetId));
            overwriteTexturesData.useBumpTexture && (material.bumpTexture = await this._makeOverwriteTexture(material.name, "Bump", packageFileLoader, assetId));
            overwriteTexturesData.useEmissiveTexture && (material.emissiveTexture = await this._makeOverwriteTexture(material.name, "Emissive", packageFileLoader, assetId));
            overwriteTexturesData.useOpacityTexture && (material.opacityTexture = await this._makeOverwriteTexture(material.name, "Opacity", packageFileLoader, assetId));
            overwriteTexturesData.useAmbientTexture && (material.ambientTexture = await this._makeOverwriteTexture(material.name, "Ambient", packageFileLoader, assetId));
            overwriteTexturesData.useLightmapTexture && (material.lightmapTexture = await this._makeOverwriteTexture(material.name, "Lightmap", packageFileLoader, assetId));
        }
    }

    private _makeAllSourceMaterials(): void {
        this._makeSourceMaterial(ENodeMaterialType.Avatar, materialJson_Avatar);
        this._makeSourceMaterial(ENodeMaterialType.Water, materialJson_Water);
    }

    private _makeSourceMaterial(type: ENodeMaterialType, json: any): void {
        const material = BABYLON.NodeMaterial.Parse(json, this._scene, '');
        material.transparencyMode = json.transparencyMode || 0;
        this._sourceMaterials.set(type, material);
    }

    private async _makeOverwriteTexture(materialName: string, texName: string, packageFileLoader: IAssetPackageFileLoader | null = null, assetId: string | undefined = undefined): Promise<BABYLON.BaseTexture | null> {
        if (packageFileLoader && assetId) {
            const imageName = `${materialName}_${texName}`;

            const imageUrl = await packageFileLoader.loadFile(eAssetType.Model_glb, assetId, imageName + ".ktx2");
            const texture = new BABYLON.Texture(imageUrl, this._scene, false, false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ".ktx2");

            texture.name = imageName;
            return texture;
        }
        return null;
    }
}
