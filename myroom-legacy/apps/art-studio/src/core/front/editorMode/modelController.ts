import { ipcRenderer } from "electron";
import * as BABYLON from '@babylonjs/core';
import { IAssetLoader, eAssetType } from 'client-core/assetSystem/definitions';
import { Logger } from '../logger';
import {
    IAssetManifest_Material, IMaterialData_Node, INodeMaterialData_InputValue, INodeMaterialData_Texture, ENodeMaterialType, getNodeMaterialName,
    IMaterialCommonData, IPBRMaterialData_OverwriteTextures, IPBRMaterialData_LightingAndColor, IPBRMaterialData_MetallicWorkflow, IMaterialData_PBR
} from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Material';
import { IAssetManifest_Model_glb, IChangeMaterialInfo } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Model_glb';
import * as path from "path";
import { TextureHelper } from "@/components/PropertyGrid/textureHelper";
import { EditorConstants } from "@/core/constant";
import { NodeMaterial } from "@babylonjs/core";
import { EditorApp } from "../editorApp";
import { EditorMode_ItemEditor } from "./editorMode_MaterialEditor";
import { TableDataManager } from "client-core";
import { KhronosTextureContainer } from "@babylonjs/core/Misc/khronosTextureContainer";
import { EItemCategory3 } from "client-core/tableData/defines/System_Enum";

export interface IUsingMaterialInfo {
    name: string;
    materialType: string;
    material: BABYLON.Material;
    originalMaterialTargetMeshPath?: string;
}

//---------------------------------------------------------------------------------------
// ModelControllerBase
//---------------------------------------------------------------------------------------
export abstract class ModelControllerBase extends BABYLON.TransformNode {
    protected _itemId: string = "";
    protected _assetDirForTool: string = "";

    public getItemId(): string {
        return this._itemId;
    }

    constructor(name: string, scene: BABYLON.Scene, assetDirForTool: string) {
        super(name, scene);
        this._assetDirForTool = assetDirForTool;
    }

    public abstract init(): Promise<void>;
    public abstract loadModel(itemId: string, assetLoader: IAssetLoader): Promise<void>;

    public getBoundingInfo(): BABYLON.BoundingInfo {
        const boundingInfo = new BABYLON.BoundingInfo(this.getAbsolutePosition().add(new BABYLON.Vector3(-0.01, -0.01, -0.01)), this.getAbsolutePosition().add(new BABYLON.Vector3(0.01, 0.01, 0.01)));
        this.getChildMeshes().forEach((m) => {
            boundingInfo.encapsulateBoundingInfo(m.getBoundingInfo());
        });

        return boundingInfo;
    }
}

//---------------------------------------------------------------------------------------
// ModelController_ItemViewer
//---------------------------------------------------------------------------------------
export class ModelController_ItemViewer extends ModelControllerBase {

    public async init(): Promise<void> {
    }

    public async loadModel(itemId: string, assetLoader: IAssetLoader): Promise<void> {
        this._itemId = itemId;

        const data = TableDataManager.getInstance().findItem(itemId);
        let assetType = eAssetType.Model_glb;
        if (data?.category3 === EItemCategory3.AVATERPRESET) {
            assetType = eAssetType.Avatar;
        }
        else if (data?.category3 === EItemCategory3.SYSTEMMYROOMEMV) {
            assetType = eAssetType.MyRoom;
        }

        //모델 로드
        const result = await assetLoader.loadAssetIntoScene(eAssetType.Model_glb, itemId);
        result.loadedObjects.meshes.forEach(m => {
            if (m.parent === null) {
                m.parent = this;
            }
        });

        // 1초 기다리기 => 아바타 로딩은 얼마나 걸릴지 모르겠당 ㅠㅠ
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

//---------------------------------------------------------------------------------------
// ModelController_MaterialEditor
//---------------------------------------------------------------------------------------
export class ModelController_MaterialEditor extends ModelControllerBase {
    private _manifest: IAssetManifest_Model_glb | null = null;
    private _usingMaterialInfos: IUsingMaterialInfo[] = [];
    private _sourceNodeMaterials: Map<string, NodeMaterial> = new Map<string, NodeMaterial>();
    private _sourceNodeMaterialInputBlockNames: Map<string, string[]> = new Map<string, string[]>();
    private _backupMaterials: Map<BABYLON.AbstractMesh, BABYLON.Material | null> = new Map<BABYLON.AbstractMesh, BABYLON.Material | null>();

    public getItemId(): string {
        return this._itemId;
    }

    public async init(): Promise<void> {
        this._scene.getEngine().wipeCaches();

        // var available = ['-astc.ktx', '-dxt.ktx', '-pvrtc.ktx', '-etc2.ktx'];
        // var formatUsed = this._scene.getEngine().setTextureFormatToUse(available);

        await this._checkAndCreateAllSourceNodeMaterials();
    }

    public async loadModel(itemId: string, assetLoader: IAssetLoader): Promise<void> {
        this._itemId = itemId;

        //모델 로드
        const result = await assetLoader.loadAssetIntoScene(eAssetType.Model_glb, itemId);
        result.loadedObjects.meshes.forEach(m => {
            if (m.parent === null) {
                m.parent = this;
            }
        });

        //backup materials
        this.getAllUsingMeshes().forEach(m => {
            this._backupMaterials.set(m, m.material || null);
        });

        //manifest 로드
        this._manifest = await assetLoader.loadManifest<IAssetManifest_Model_glb>(eAssetType.Model_glb, itemId, undefined);

        //material 로드
        let materialManifests: IAssetManifest_Material[] = [];
        const jsonFileNames = await ipcRenderer.invoke('electron:findFiles', this._assetDirForTool, ".json");
        for (let i = 0; i < jsonFileNames.length; ++i) {
            const fileName = jsonFileNames[i];
            if (fileName === "manifest.json")
                continue;

            //const material = await assetLoader.loadManifest<IAssetManifest_Material>(eAssetType.Model_glb, itemId, fileName);
            const material = await ipcRenderer.invoke('electron:readJsonFile', path.join(this._assetDirForTool, fileName));
            if (material && material.main.type === "Material") {
                materialManifests.push(material);
            }
        }

        for (let i = 0; i < materialManifests.length; ++i) {
            const m = materialManifests[i];
            if (m.main.materialType === "NodeMaterial") {
                const material = this.createNewNodeMaterial(m.main.data.type, m.main.name);
                if (material) {
                    //common Data 적용
                    if (m.main.data.commonData) {
                        if (m.main.data.commonData.depthFunction) {
                            material.depthFunction = m.main.data.commonData.depthFunction;
                        }
                        if (m.main.data.commonData.needDepthPrePass !== undefined) {
                            material.needDepthPrePass = m.main.data.commonData.needDepthPrePass;
                        }
                        material.alpha = m.main.data.commonData.alpha;
                        material.transparencyMode = m.main.data.commonData.transparencyMode;
                        material.alphaMode = m.main.data.commonData.alphaMode;
                    }

                    //Input Value 적용
                    m.main.data.inputValues.forEach((input: any) => {
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
                                Logger.error(`Not handled Input Value  : ${value.type} , inputName : ${input.name} inputvalue : ${input.value}`);
                            }
                        }
                    });

                    //Texture 적용
                    for (let t = 0; t < m.main.data.textures.length; ++t) {
                        const texture = m.main.data.textures[t];
                        const textureBlocks = material.getTextureBlocks();
                        const texblock = textureBlocks.find((b) => { return b.name === texture.name; /*&& b.uniqueId === texture.id;*/ });
                        if (texblock) {
                            const imageName = `${material.name}_${texblock.name}`;
                            //url로 읽는 방식이 편해서 에셋서버에서 이미지 읽어온다.
                            const imageUrl = this._makeImageUrlForAssetServer(itemId, imageName + ".ktx2");
                            const texture = new BABYLON.Texture(imageUrl, this._scene, false, false);
                            texture.name = imageName;
                            texblock.texture = texture;
                        }
                    }
                }
            }
            else if (m.main.materialType === "PBRMaterial") {
                //툴에서는 연속적인 수정을 위해 Clone 한다 ==> 에디터가 아닌 runtime에는 바로 메터리얼에 적용한다.
                const material = await this.createCloneMaterial_PBR(m.main.data.targetMeshPath, m.main.name);

                if (material) {
                    //common Data 적용
                    if (m.main.data.commonData) {
                        if (m.main.data.commonData.depthFunction) {
                            material.depthFunction = m.main.data.commonData.depthFunction;
                        }
                        if (m.main.data.commonData.needDepthPrePass !== undefined) {
                            material.needDepthPrePass = m.main.data.commonData.needDepthPrePass;
                        }
                        material.alpha = m.main.data.commonData.alpha;
                        material.transparencyMode = m.main.data.commonData.transparencyMode;
                        material.alphaMode = m.main.data.commonData.alphaMode;
                    }

                    //LightingAndColor
                    const lightingAndColorData: IPBRMaterialData_LightingAndColor = m.main.data.lightingAndColorData as IPBRMaterialData_LightingAndColor;
                    material.albedoColor = BABYLON.Color3.FromArray(lightingAndColorData.albedoColor);
                    material.reflectivityColor = BABYLON.Color3.FromArray(lightingAndColorData.reflectivityColor);
                    material.microSurface = lightingAndColorData.microSurface;
                    material.emissiveColor = BABYLON.Color3.FromArray(lightingAndColorData.emissiveColor);
                    material.ambientColor = BABYLON.Color3.FromArray(lightingAndColorData.ambientColor);
                    material.usePhysicalLightFalloff = lightingAndColorData.usePhysicalLightFalloff;

                    //IPBRMaterialData_MetallicWorkflow
                    const metalicWorkflowData: IPBRMaterialData_MetallicWorkflow = m.main.data.metalicWorkflowData as IPBRMaterialData_MetallicWorkflow;
                    material.metallic = metalicWorkflowData.metallic;
                    material.roughness = metalicWorkflowData.roughness;
                    material.indexOfRefraction = metalicWorkflowData.indexOfRefraction;
                    material.metallicF0Factor = metalicWorkflowData.F0Factor;
                    material.metallicReflectanceColor = BABYLON.Color3.FromArray(metalicWorkflowData.reflectanceColor);

                    //OverwriteTextures 적용
                    const overwriteTexturesData: IPBRMaterialData_OverwriteTextures = m.main.data.overwriteTextures as IPBRMaterialData_OverwriteTextures;
                    overwriteTexturesData.useAlbedoTexture && (material.albedoTexture = await this._makeOverwriteTexture(itemId, material.name, "Albedo"));
                    overwriteTexturesData.useMetallicTexture && (material.metallicTexture = await this._makeOverwriteTexture(itemId, material.name, "Metallic"));
                    overwriteTexturesData.useReflectionTexture && (material.reflectionTexture = await this._makeOverwriteTexture(itemId, material.name, "Reflection"));
                    overwriteTexturesData.useRefractionTexture && (material.refractionTexture = await this._makeOverwriteTexture(itemId, material.name, "Refraction"));
                    overwriteTexturesData.useReflectivityTexture && (material.reflectivityTexture = await this._makeOverwriteTexture(itemId, material.name, "Reflectivity"));
                    overwriteTexturesData.useMicroSurfaceTexture && (material.microSurfaceTexture = await this._makeOverwriteTexture(itemId, material.name, "MicroSurface"));
                    overwriteTexturesData.useBumpTexture && (material.bumpTexture = await this._makeOverwriteTexture(itemId, material.name, "Bump"));
                    overwriteTexturesData.useEmissiveTexture && (material.emissiveTexture = await this._makeOverwriteTexture(itemId, material.name, "Emissive"));
                    overwriteTexturesData.useOpacityTexture && (material.opacityTexture = await this._makeOverwriteTexture(itemId, material.name, "Opacity"));
                    overwriteTexturesData.useAmbientTexture && (material.ambientTexture = await this._makeOverwriteTexture(itemId, material.name, "Ambient"));
                    overwriteTexturesData.useLightmapTexture && (material.lightmapTexture = await this._makeOverwriteTexture(itemId, material.name, "Lightmap"));
                }
            }
        }

        //메터리얼 적용
        if (this._manifest!.main.materials) {
            this._manifest!.main.materials.forEach((m) => {
                const usingMaterial = this._usingMaterialInfos.find((info) => { return info.name === m.materialName; });
                if (usingMaterial) {
                    const targetMesh = this.findMeshByMeshPath(m.targetMeshPath);
                    if (targetMesh) {
                        targetMesh.material = usingMaterial.material;
                    }
                    else {
                        Logger.error(`ToolModelController.loadModel() - mesh not found. meshPath=${m.targetMeshPath}`);
                    }
                }
                else {
                    Logger.error(`ToolModelController.loadModel() - material not found. materialName=${m.materialName}`);
                }
            });
        }

        EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_REFRESH_UI);

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    public getAllUsingMeshes(): BABYLON.AbstractMesh[] {
        const meshes: BABYLON.AbstractMesh[] = [];
        this.getChildMeshes().forEach(m => {
            if (m instanceof BABYLON.AbstractMesh) {
                meshes.push(m);
            }
        });
        return meshes;
    }

    public getAllUsingMaterialInfos(): IUsingMaterialInfo[] {
        return this._usingMaterialInfos;
    }

    public getAllUsingTextures(): BABYLON.BaseTexture[] {
        const textures: BABYLON.BaseTexture[] = [];
        this._usingMaterialInfos.forEach((info) => {
            const material = info.material;
            if (material instanceof BABYLON.NodeMaterial) {
                material.getTextureBlocks().forEach((block) => {
                    if (block.texture) {
                        //이름 바꿔주자.. ㅠㅠ 텍스쳐 추가시 이름 변경할 적당한 곳이 없다 ㅠㅠ
                        const textureName = `${material.name}_${block.name}`;
                        block.texture.name = textureName;
                        textures.push(block.texture);
                    }
                });
            }
            else {
                info.material.getActiveTextures().forEach((t) => {
                    textures.push(t);
                });
            }
        });

        return textures;
    }

    public findMeshByMeshPath(meshPath: string): BABYLON.AbstractMesh | null {
        const rootMesh = this.getChildMeshes(true).find(m => m.name === "__root__");
        if (rootMesh) {

            //그냥 메쉬이름을 사용한다.
            return rootMesh.getChildMeshes(false).find(m => m.name === meshPath) || null;

            // const path = meshPath.split("$");
            // let targetMesh = rootMesh;
            // for (let i = 0; i < path.length; i++) {
            //     let childMesh = targetMesh.getChildMeshes(true).find(m => m.name === path[i]);
            //     if (childMesh) {
            //         targetMesh = childMesh;
            //     }
            //     else {
            //         return null;
            //     }
            // }

            // return targetMesh;
        }

        return null;
    }

    public makeMeshPath(childMesh: BABYLON.AbstractMesh): string | undefined {
        const mesh = this.getChildMeshes().find(m => m === childMesh);
        return mesh?.name; //그냥 이름을 사용한다 => 경로중에 같은이름의 node들이 많아서 찿을 방법이 없다.
    }

    public createNewNodeMaterial(type: ENodeMaterialType, mtlName: string | undefined = undefined): NodeMaterial | null {
        const materialName = getNodeMaterialName(type);
        const sourceMaterial = this._sourceNodeMaterials.get(materialName);
        if (sourceMaterial) {
            const name = mtlName || this._generateMaterialName();
            const cloneMtl = sourceMaterial.clone(name, true);
            this._usingMaterialInfos.push({
                name: name,
                materialType: cloneMtl!.getClassName(),
                material: cloneMtl!,
            });

            //texture 이름 변경
            const textureBlocks = cloneMtl!.getTextureBlocks();
            textureBlocks.forEach((block) => {
                if (block.texture) {
                    const textureName = `${cloneMtl!.name}_${block.name}`;
                    block.texture!.name = textureName;
                }
            });

            return cloneMtl;
        }


        return null;
    }

    public deleteNodeMaterial(materialName: string): void {
        const usingMaterialInfo = this._usingMaterialInfos.find(m => m.name === materialName);
        if (usingMaterialInfo) {
            const info = this._manifest!.main.materials?.find((m) => { return m.materialName === materialName; });
            if (info) {
                this.assignNodeMaterial(info.targetMeshPath, "");
            }

            this._usingMaterialInfos.splice(this._usingMaterialInfos.indexOf(usingMaterialInfo), 1);
            usingMaterialInfo.material.dispose();
            Logger.log(`메터리얼(${materialName})을 삭제하였습니다.`);
        }
        else {
            console.error(`ToolModelController.deleteNodeMaterial() - material not found. materialName=${materialName}`);
        }
    }

    public async createCloneMaterial_PBR(originalMaterialTargetMeshPath: string, mtlName: string | undefined = undefined): Promise<BABYLON.PBRMaterial | null> {
        const targetMesh = this.findMeshByMeshPath(originalMaterialTargetMeshPath);
        if (targetMesh) {
            const orgMatarial = targetMesh?.material as BABYLON.PBRMaterial;
            const name = mtlName || this._generateMaterialName();
            const cloneMtl = orgMatarial.clone(name, false); //cloneTexturesOnlyOnce === false 같은 texture 더라도 따로 생성한다.!!

            this._usingMaterialInfos.push({
                name: name,
                materialType: cloneMtl!.getClassName(),
                material: cloneMtl!,
                originalMaterialTargetMeshPath: originalMaterialTargetMeshPath,
            });

            //texture 이름 변경
            const textures = cloneMtl.getActiveTextures();
            for (let i = 0; i < textures.length; ++i) {
                const tex = textures[i];

                (tex as any)._mimeType = ""; //gltf-transform을 거치 glb 파일들은 mimeType 이 "image/ktx2" 로 고정 되어 있어서 png 파일을 로드하지 못한다.

                //albedo
                if (orgMatarial.albedoTexture) {
                    const same = await this._isSameTextrue(orgMatarial.albedoTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Albedo`;
                        continue;
                    }
                }

                //metallicTexture
                if (orgMatarial.metallicTexture) {
                    const same = await this._isSameTextrue(orgMatarial.metallicTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Metallic`;
                        continue;
                    }
                }

                //reflectionTexture
                if (orgMatarial.reflectionTexture) {
                    const same = await this._isSameTextrue(orgMatarial.reflectionTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Reflection`;
                        continue;
                    }
                }

                //reflectivityTexture
                if (orgMatarial.reflectivityTexture) {
                    const same = await this._isSameTextrue(orgMatarial.reflectivityTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Reflectivity`;
                        continue;
                    }
                }

                //microSurfaceTexture
                if (orgMatarial.microSurfaceTexture) {
                    const same = await this._isSameTextrue(orgMatarial.microSurfaceTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_MicroSurface`;
                        continue;
                    }
                }

                //bumpTexture
                if (orgMatarial.bumpTexture) {
                    const same = await this._isSameTextrue(orgMatarial.bumpTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Bump`;
                        continue;
                    }
                }

                //emissiveTexture
                if (orgMatarial.emissiveTexture) {
                    const same = await this._isSameTextrue(orgMatarial.emissiveTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Emissive`;
                        continue;
                    }
                }

                //opacityTexture
                if (orgMatarial.opacityTexture) {
                    const same = await this._isSameTextrue(orgMatarial.opacityTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Opacity`;
                        continue;
                    }
                }


                //ambientTexture
                if (orgMatarial.ambientTexture) {
                    const same = await this._isSameTextrue(orgMatarial.ambientTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Ambient`;
                        continue;
                    }
                }

                //lightmapTexture
                if (orgMatarial.lightmapTexture) {
                    const same = await this._isSameTextrue(orgMatarial.lightmapTexture, tex);
                    if (same) {
                        tex.name = `${cloneMtl!.name}_Lightmap`;
                        continue;
                    }
                }

            };

            return cloneMtl;
        }

        return null;
    }

    public assignNodeMaterial(meshPath: string, materialName: string): void {
        const targetMesh = this.findMeshByMeshPath(meshPath);
        if (targetMesh) {
            if (materialName === "") {
                const backupMaterial = this._backupMaterials.get(targetMesh);
                if (backupMaterial) {
                    targetMesh.material = backupMaterial;
                    Logger.log(`메쉬(${meshPath})의 메터리얼을 기본 메터리얼로 변경하였습니다.`);
                }
            }
            else {
                const usingMaterialInfo = this._usingMaterialInfos.find(m => m.name === materialName);
                if (usingMaterialInfo) {
                    targetMesh.material = usingMaterialInfo.material;
                    Logger.log(`메쉬(${meshPath})의 메터리얼을 ${materialName}로 변경하였습니다.`);
                }
                else {
                    console.error(`ToolModelController.assignNodeMaterial() - material not found. materialName=${materialName}`);
                }
            }
        }
        else {
            console.error(`ToolModelController.assignNodeMaterial() - mesh not found. meshPath=${meshPath}`);
        }
    }

    public async saveAll() {
        if (!this._manifest) {
            console.error("ToolModelController._saveAll(): manifest is null");
            return;
        }

        //개별 메터리얼 저장
        for (let i = 0; i < this._usingMaterialInfos.length; ++i) {
            const info = this._usingMaterialInfos[i];

            const material = info.material;
            //const meshPath = info.targetMeshPath;

            const materialJson: IAssetManifest_Material = {
                format: 3,
                main: {
                    type: 'Material',
                    name: info.name,
                    materialType: material!.getClassName(),
                    data: await this._makeMaterialJson(material!, info.originalMaterialTargetMeshPath || ""),
                }
            };
            const filePath = path.join(this._assetDirForTool, `${info.name}.json`);
            await ipcRenderer.invoke('electron:saveJson', filePath, JSON.stringify(materialJson));


            //텍스쳐 저장
            await this._saveTextures(material);
        };

        //manifest 저장
        const changeMaterialInfos: IChangeMaterialInfo[] = [];
        this.getAllUsingMeshes().forEach((m) => {
            const material = m.material;
            if (material) {
                const materialName = material.name;
                if (materialName) {
                    if (this._usingMaterialInfos.findIndex((info) => { return info.material === material; }) >= 0) {
                        changeMaterialInfos.push({
                            targetMeshPath: this.makeMeshPath(m) || "",
                            materialName: materialName,
                        });
                    }
                }
            }
        });

        this._manifest.main.materials = changeMaterialInfos.length > 0 ? changeMaterialInfos : undefined;

        const filePath = path.join(this._assetDirForTool, `manifest.json`);
        ipcRenderer.invoke('electron:saveJson', filePath, JSON.stringify(this._manifest!));
    }

    //-----------------------------------------------------------------------------------
    // private helpers
    //-----------------------------------------------------------------------------------
    private _generateMaterialName(): string {
        return Math.random().toString(16).substr(2, 9);
    }

    private _makeImageUrlForAssetServer(itemId: string, imageName: string): string {
        let baseDir = "";
        const tableData = TableDataManager.getInstance().findItem(itemId);
        if (tableData) {
            const categoryInfo = TableDataManager.getInstance().findCategory3(tableData.category3.toString());
            if (categoryInfo) {
                baseDir = path.join(categoryInfo.SvnFolder, tableData.client_itemid).replaceAll("\\", "/");
            }
        }
        return `http://localhost:9567/${baseDir}/${imageName}`;
    }

    //-----------------------------------------------------------------------------------
    // materials 관련
    //-----------------------------------------------------------------------------------
    private async _checkAndCreateAllSourceNodeMaterials(): Promise<void> {
        await this._checkAndCreateSourceNodeMaterial(ENodeMaterialType.Avatar);
        await this._checkAndCreateSourceNodeMaterial(ENodeMaterialType.Water);
    }

    private async _checkAndCreateSourceNodeMaterial(type: ENodeMaterialType): Promise<void> {
        const svnDir = path.dirname(path.dirname(path.dirname(this._assetDirForTool))); //svn 디렉토리
        const nodeJsonDir = path.join(svnDir, "NodeMaterials"); //node json 디렉토리

        const materialName = getNodeMaterialName(type);
        if (!this._sourceNodeMaterials.has(materialName)) {
            const json = await ipcRenderer.invoke('electron:readJsonFile', path.join(nodeJsonDir, `${materialName}.json`));
            if (json) {
                const material = NodeMaterial.Parse(json, this.getScene(), "");
                //console.log(material.comment);
                material.transparencyMode = json.transparencyMode || 0;
                material.metadata = type.toString();
                const allErrorNames: string[] = [];
                if (this._checkSourceMaterialInputNames(type, material, allErrorNames)) {
                    this._sourceNodeMaterials.set(materialName, material);
                }
                else {
                    Logger.error(`NodeMaterial Type (${type})에 중복된 Input Name이 있습니다. 중복된 Input Names : ${allErrorNames}`);
                }
            }
            else {
                Logger.error(`NodeMaterial Type (${type})에 맞는 json 파일을 찿을수 없습니다.`);
            }
        }
    }

    private _checkSourceMaterialInputNames(type: ENodeMaterialType, material: NodeMaterial, allErrorInputNames: string[]): boolean {
        if (material) {
            for (let ii = 0; ii < material.getInputBlocks().length; ++ii) {
                const inputName = material.getInputBlocks()[ii].name;
                for (let jj = 0; jj < material.getInputBlocks().length; ++jj) {
                    if (ii != jj) {
                        if (material.getInputBlocks()[jj].name === inputName) {
                            allErrorInputNames.push(inputName);
                        }
                    }
                }
            }

            return allErrorInputNames.length === 0;
        }

        return false;
    }

    private async _makeMaterialJson(material: BABYLON.Material, targetMeshPath: string): Promise<any> {
        if (material.getClassName() === "NodeMaterial") {
            return await this._makeMaterialJson_Node(material as NodeMaterial);
        }
        else if (material.getClassName() === "PBRMaterial") {
            return await this._makeMaterialJson_PBR(material as BABYLON.PBRMaterial, targetMeshPath);
        }
        else if (material.getClassName() === "StandardMaterial") {
            return await this._makeMaterialJson_Standard(material as BABYLON.StandardMaterial);
        }

        console.error(`ToolModelController._makeMaterialJson() - not supported material type. materialName=${material.getClassName()}`);
        return null;
    }

    private async _makeMaterialJson_Node(material: NodeMaterial): Promise<IMaterialData_Node> {
        const type = material.metadata as ENodeMaterialType;
        const inputValues: INodeMaterialData_InputValue[] = [];
        const textureValues: INodeMaterialData_Texture[] = [];

        //commonData
        const commonData: IMaterialCommonData = {
            depthFunction: material.depthFunction,
            needDepthPrePass: material.needDepthPrePass,
            alpha: material.alpha,
            transparencyMode: material.transparencyMode,
            alphaMode: material.alphaMode,
        };


        //input values
        material.getInputBlocks().forEach((input) => {
            const value = input.value;
            let valueType = "number";
            if (input.value) {
                valueType = input.value.asArray ? "BABYLON." + input.value.getClassName() : "number";
            }
            inputValues.push({
                name: input.name,
                id: input.uniqueId,
                valueType: valueType,
                value: value?.asArray ? value.asArray() : value,
            });
        });


        //textures
        material.getTextureBlocks().forEach((texture) => {
            if (texture.texture) {
                textureValues.push({
                    name: texture.name,
                    id: texture.uniqueId,
                    //textureData: texture.texture.serialize(),
                });
            }
        });

        return { commonData: commonData, type: type, inputValues: inputValues, textures: textureValues };
    }

    private async _makeMaterialJson_PBR(material: BABYLON.PBRMaterial, targetMeshPath: string): Promise<IMaterialData_PBR> {
        const commonData: IMaterialCommonData = {
            depthFunction: material.depthFunction,
            needDepthPrePass: material.needDepthPrePass,
            alpha: material.alpha,
            transparencyMode: material.transparencyMode,
            alphaMode: material.alphaMode,
        };

        const overwriteTextures: IPBRMaterialData_OverwriteTextures = await this._makeOverwriteTexturesData(material);

        const lightingAndColorData: IPBRMaterialData_LightingAndColor = {
            albedoColor: material.albedoColor.asArray(),
            reflectivityColor: material.reflectivityColor.asArray(),
            microSurface: material.microSurface,
            emissiveColor: material.emissiveColor.asArray(),
            ambientColor: material.ambientColor.asArray(),
            usePhysicalLightFalloff: material.usePhysicalLightFalloff,
        };

        const metalicWorkflowData: IPBRMaterialData_MetallicWorkflow = {
            metallic: material.metallic,
            roughness: material.roughness,
            indexOfRefraction: material.indexOfRefraction,
            F0Factor: material.metallicF0Factor,
            reflectanceColor: material.metallicReflectanceColor.asArray(),
        };

        const data = {
            targetMeshPath,
            commonData,
            overwriteTextures,
            lightingAndColorData,
            metalicWorkflowData,
        };

        return data;
    }

    private async _makeMaterialJson_Standard(material: BABYLON.StandardMaterial): Promise<any> {
        const json = material.serialize();
        return json;
    }

    private async _saveTextures(material: BABYLON.Material): Promise<void> {
        if (material.getClassName() === "NodeMaterial") {
            await this._saveTextures_NodeMaterial(material);
        }
        else if (material.getClassName() === "PBRMaterial" || material.getClassName() === "StandardMaterial") {
            await this._saveTextures_NotNode(material);
        }
    }

    private async _saveTextures_NodeMaterial(material: BABYLON.Material): Promise<void> {
        const textures = material!.getActiveTextures();
        for (let ii = 0; ii < textures.length; ++ii) {
            const t = textures[ii];
            const imgW = t.getSize().width;
            const imgH = t.getSize().height;

            const filePath = path.join(this._assetDirForTool, `${t.name}.png`);
            const imgData = await TextureHelper.GetTextureDataAsync(t, t.getSize().width, t.getSize().height, 1, { R: true, G: true, B: true, A: true });
            //const imgData = await t.readPixels(undefined, undefined, undefined, false); //==> 압축 텍스쳐는 read 못한다. GL Error
            BABYLON.DumpTools.DumpData(imgW, imgH, imgData!, (data) => {
                ipcRenderer.invoke('electron:saveImage', data, filePath);
            });
        }
    }

    private async _saveTextures_NotNode(material: BABYLON.Material): Promise<void> {
        const textures = material!.getActiveTextures();
        for (let ii = 0; ii < textures.length; ++ii) {
            const t = textures[ii];
            //텍스쳐가 변경된 경우만 저장한다!!!
            const originalMtl = this._getOriginalMaterialByCloneMaterial(material);
            if (await this._isTextureChagned(t, originalMtl)) {
                const imgW = t.getSize().width;
                const imgH = t.getSize().height;
                const filePath = path.join(this._assetDirForTool, `${t.name}.png`);
                const imgData = await TextureHelper.GetTextureDataAsync(t, t.getSize().width, t.getSize().height, 1, { R: true, G: true, B: true, A: true });
                BABYLON.DumpTools.DumpData(imgW, imgH, imgData!, (data) => {
                    ipcRenderer.invoke('electron:saveImage', data, filePath);
                });
            }
        }
    }

    private async _isSameTextrue(tex1: BABYLON.BaseTexture, tex2: BABYLON.BaseTexture): Promise<boolean> {
        const imgData1 = await TextureHelper.GetTextureDataAsync(tex1, tex1.getSize().width, tex1.getSize().height, 1, { R: true, G: true, B: true, A: true });
        const imgData2 = await TextureHelper.GetTextureDataAsync(tex2, tex2.getSize().width, tex2.getSize().height, 1, { R: true, G: true, B: true, A: true });

        if (imgData1.length != imgData2.length) {
            return false;
        }

        for (let ii = 0; ii < imgData1.length; ++ii) {
            if (imgData1[ii] !== imgData2[ii]) {
                return false;
            }
        };

        return true;
    }

    private _getOriginalMaterialByCloneMaterial(cloneMtl: BABYLON.Material): BABYLON.Material | null {
        const info = this._usingMaterialInfos.find((info) => { return info.material === cloneMtl; });
        if (info) {
            const originalMaterialTargetMesh = this.findMeshByMeshPath(info.originalMaterialTargetMeshPath!);
            if (originalMaterialTargetMesh) {
                return this._backupMaterials.get(originalMaterialTargetMesh) || null;
            }
        }

        return null;
    }

    private async _isTextureChagned(texture: BABYLON.BaseTexture, originalMtl: BABYLON.Material | null): Promise<boolean> {

        if (texture && originalMtl === null) {
            return true;
        }

        if (texture.name.indexOf("_Albedo") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.albedoTexture) {
                return !await this._isSameTextrue(originalMtl.albedoTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Metallic") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.metallicTexture) {
                return !await this._isSameTextrue(originalMtl.metallicTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Reflection") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.reflectionTexture) {
                return !await this._isSameTextrue(originalMtl.reflectionTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Reflectivity") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.reflectivityTexture) {
                return !await this._isSameTextrue(originalMtl.reflectivityTexture, texture);
            }
        }
        else if (texture.name.indexOf("_MicroSurface") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.microSurfaceTexture) {
                return !await this._isSameTextrue(originalMtl.microSurfaceTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Bump") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.bumpTexture) {
                return !await this._isSameTextrue(originalMtl.bumpTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Emissive") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.emissiveTexture) {
                return !await this._isSameTextrue(originalMtl.emissiveTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Opacity") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.opacityTexture) {
                return !await this._isSameTextrue(originalMtl.opacityTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Ambient") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.ambientTexture) {
                return !await this._isSameTextrue(originalMtl.ambientTexture, texture);
            }
        }
        else if (texture.name.indexOf("_Lightmap") >= 0) {
            if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.lightmapTexture) {
                return !await this._isSameTextrue(originalMtl.lightmapTexture, texture);
            }
        }

        return false;
    }

    private async _makeOverwriteTexturesData(material: BABYLON.Material): Promise<IPBRMaterialData_OverwriteTextures> {
        const data: IPBRMaterialData_OverwriteTextures = {
            useAlbedoTexture: false,
            useMetallicTexture: false,
            useReflectionTexture: false,
            useRefractionTexture: false,
            useReflectivityTexture: false,
            useMicroSurfaceTexture: false,
            useBumpTexture: false,
            useEmissiveTexture: false,
            useOpacityTexture: false,
            useAmbientTexture: false,
            useLightmapTexture: false,
        };

        const originalMtl = this._getOriginalMaterialByCloneMaterial(material);
        const textures = material.getActiveTextures();
        for (let ii = 0; ii < textures.length; ++ii) {
            const texture = textures[ii];

            if (texture.name.indexOf("_Albedo") >= 0) {
                if (null === originalMtl) {
                    data.useAlbedoTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.albedoTexture) {
                    if (!await this._isSameTextrue(originalMtl.albedoTexture, texture)) {
                        data.useAlbedoTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Metallic") >= 0) {
                if (null === originalMtl) {
                    data.useMetallicTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.metallicTexture) {
                    if (!await this._isSameTextrue(originalMtl.metallicTexture, texture)) {
                        data.useMetallicTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Reflection") >= 0) {
                if (null === originalMtl) {
                    data.useReflectionTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.reflectionTexture) {
                    if (!await this._isSameTextrue(originalMtl.reflectionTexture, texture)) {
                        data.useReflectionTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Reflectivity") >= 0) {
                if (null === originalMtl) {
                    data.useReflectivityTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.reflectivityTexture) {
                    if (!await this._isSameTextrue(originalMtl.reflectivityTexture, texture)) {
                        data.useReflectivityTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_MicroSurface") >= 0) {
                if (null === originalMtl) {
                    data.useMicroSurfaceTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.microSurfaceTexture) {
                    if (!await this._isSameTextrue(originalMtl.microSurfaceTexture, texture)) {
                        data.useMicroSurfaceTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Bump") >= 0) {
                if (null === originalMtl) {
                    data.useBumpTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.bumpTexture) {
                    if (!await this._isSameTextrue(originalMtl.bumpTexture, texture)) {
                        data.useBumpTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Emissive") >= 0) {
                if (null === originalMtl) {
                    data.useEmissiveTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.emissiveTexture) {
                    if (!await this._isSameTextrue(originalMtl.emissiveTexture, texture)) {
                        data.useEmissiveTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Opacity") >= 0) {
                if (null === originalMtl) {
                    data.useOpacityTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.opacityTexture) {
                    if (!await this._isSameTextrue(originalMtl.opacityTexture, texture)) {
                        data.useOpacityTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Ambient") >= 0) {
                if (null === originalMtl) {
                    data.useAmbientTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.ambientTexture) {
                    if (!await this._isSameTextrue(originalMtl.ambientTexture, texture)) {
                        data.useAmbientTexture = true;
                    }
                }
            }
            else if (texture.name.indexOf("_Lightmap") >= 0) {
                if (null === originalMtl) {
                    data.useLightmapTexture = true;
                }
                else if (originalMtl instanceof BABYLON.PBRMaterial && originalMtl.lightmapTexture) {
                    if (!await this._isSameTextrue(originalMtl.lightmapTexture, texture)) {
                        data.useLightmapTexture = true;
                    }
                }
            }
        }
        return data;
    }

    private async _makeOverwriteTexture(itemId: string, materialName: string, texName: string): Promise<BABYLON.BaseTexture> {
        const imageName = `${materialName}_${texName}`;
        const imageUrl = this._makeImageUrlForAssetServer(itemId, imageName + ".ktx2");
        const texture = new BABYLON.Texture(imageUrl, this._scene, false, false);
        texture.name = imageName;
        return texture;
    }
}