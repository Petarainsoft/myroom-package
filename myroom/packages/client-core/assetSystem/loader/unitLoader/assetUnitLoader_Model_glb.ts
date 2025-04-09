import { AbstractMesh, Nullable } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";

import { IAssetUnitLoader } from "./assetUnitLoader";
import { eAssetType, IAssetLoader, IAssetPackageFileLoader } from "../../definitions";
import { IAssetManifest } from "../../jsonTypes/manifest/assetManifest";
import { IAssetManifest_Model_glb } from "../../jsonTypes/manifest/assetManifest_Model_glb";
import { Constants } from "../../constants";
import { ELoadPostAssetWhen, PostAssetLoader } from "../../postAssetLoader/postAssetLoader";
import { convertStringToNodeMaterialType, IAssetManifest_Material } from "../../jsonTypes/manifest/assetManifest_Material";
import { MaterialManager } from "../../controllers/materialManager";
import { WaitList } from "../../package/assetPackageFileLoader";
import { ParticleLoader } from "client-core/assetSystem/controllers/particleSubSystem/particleLoader";

// max나 blender에서 추출시, glb에 이 값이 안나온다. 그래서 아트팀과 얘기해서 강제로 설정 (by ulralra 20230829)
const AMBIENT_TEXTURE_STRENGTH = 0.5;

export class AssetUnitLoader_Model_glb implements IAssetUnitLoader {
    private _scene: Nullable<BABYLON.Scene> = null;
    private _assetContainerCache = new Map<string, BABYLON.AssetContainer>();
    private _packageFileLoader: Nullable<IAssetPackageFileLoader> = null;
    private _materialManager: Nullable<MaterialManager> = null;
    private _assetLoader: Nullable<IAssetLoader> = null;
    private _loadingAssets: Map<string, WaitList> = new Map<string, WaitList>();

    constructor(scene: Nullable<BABYLON.Scene> = null, packageFileLoader: Nullable<IAssetPackageFileLoader>, nodeMaterialManager: Nullable<MaterialManager> = null, assetLoader: Nullable<IAssetLoader> = null) {
        this._scene = scene || BABYLON.EngineStore.LastCreatedScene;
        this._packageFileLoader = packageFileLoader;
        this._materialManager = nodeMaterialManager;
        this._assetLoader = assetLoader;
    }

    async loadAssetUnit(manifest: IAssetManifest, assetInfo: { assetType: eAssetType; assetId: string; }, parent?: Nullable<BABYLON.Node>, essentialLoaded?: (result: Nullable<BABYLON.ISceneLoaderAsyncResult>) => void): Promise<Nullable<BABYLON.ISceneLoaderAsyncResult>> {
        const _manifest: IAssetManifest_Model_glb = manifest as IAssetManifest_Model_glb;
        if (!_manifest) {
            return null;
        }

        let assetContainer = this._assetContainerCache.get(assetInfo.assetId);
        if (!assetContainer) {
            if (_manifest) {
                const modelFile = _manifest.main.modelfile;
                if (modelFile && this._packageFileLoader) {
                    const assetUrl = await this._packageFileLoader.loadFile(assetInfo.assetType, assetInfo.assetId, modelFile);
                    if (assetUrl === "") {
                        console.error("AssetUnitLoader_Model_glb.loadAssetUnit() assetUrl is null.");
                        return null;
                    }

                    if (this._loadingAssets.has(assetUrl)) {
                        const waitList = this._loadingAssets.get(assetUrl);
                        if (waitList) {
                            //console.error("loadasset-wait", assetUrl);
                            await waitList.wait();
                        }
                    }
                    // 위의 wait에서 넘어올 경우, 다시 한번 체크해야 한다.
                    assetContainer = this._assetContainerCache.get(assetInfo.assetId);
                    if (!assetContainer) {
                        const waitList = new WaitList();
                        this._loadingAssets.set(assetUrl, waitList);

                        //console.error("loadasset-load", assetUrl);

                        assetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync("", assetUrl, this._scene, undefined, ".glb");
                        this._assetContainerCache.set(assetInfo.assetId, assetContainer);
                        //씬에 사용하는 texture는 올려주자
                        assetContainer.textures.forEach((tex) => {
                            this._scene?.addTexture(tex);
                        });
                        // 사용안하는 원본 bone animation은 stop한다. 그래야 괜히 animate함수가 돌아가지 않는다. (by ulralra)
                        assetContainer.skeletons.forEach((sk) => {
                            sk.bones.forEach((bone) => {
                                this._scene?.stopAnimation(bone.getTransformNode());
                            });
                        });

                        waitList.notifyAll();
                        this._loadingAssets.delete(assetUrl);
                    }
                }
            }
        }

        if (assetContainer) {
            const result = {
                meshes: new Array<BABYLON.AbstractMesh>,
                particleSystems: new Array<BABYLON.IParticleSystem>,
                skeletons: new Array<BABYLON.Skeleton>,
                animationGroups: new Array<BABYLON.AnimationGroup>,
                transformNodes: new Array<BABYLON.TransformNode>,
                geometries: new Array<BABYLON.Geometry>,
                lights: new Array<BABYLON.Light>
            };

            const entries = assetContainer.instantiateModelsToScene(
                (sourceName) => { return sourceName; }
            );

            //InstantiatedEntries node 처리
            for (let node of entries.rootNodes) {
                if (node instanceof BABYLON.AbstractMesh) {
                    result.meshes.push(node);
                    // asset이 생성되자마자 원점에 보이는 현상을 없애기 위해서 바로 parent에 붙인다. (by ulralra)
                    if (parent && node.parent === null) {
                        node.parent = parent;
                    }
                }
                else if (node instanceof BABYLON.TransformNode) {
                    result.transformNodes.push(node);
                }
                else if (node instanceof BABYLON.Light) {
                    result.lights.push(node);
                }

                // glb export 시 설정되지 않는 값들은 여기에서 설정한다.
                node.getChildMeshes().forEach((mesh) => {
                    if (mesh.material && mesh.material instanceof BABYLON.PBRMaterial) {
                        mesh.material._ambientTextureStrength = AMBIENT_TEXTURE_STRENGTH;
                    }
                });
            }

            //InstantiatedEntries skeletons 처리
            result.skeletons = entries.skeletons;

            //animation animationGroups 처리
            result.animationGroups = entries.animationGroups;

            //scale과 rot 처리
            for (let node of entries.rootNodes) {
                if (node instanceof BABYLON.TransformNode) {
                    if (_manifest.main.scale) {
                        node.scaling = node.scaling.multiply(new BABYLON.Vector3(_manifest.main.scale, _manifest.main.scale, _manifest.main.scale));
                    }

                    if (_manifest.main.rotAngle) {
                        if (node.rotationQuaternion) {
                            node.rotationQuaternion = node.rotationQuaternion?.multiply(BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(_manifest.main.rotAngle), 0));
                        }
                    }
                }
            }


            //기본 에니메이션 실행
            if (entries.animationGroups.length > 0) {
                if (_manifest.main.playAnim) {
                    const idx = entries.animationGroups.findIndex(g => g.name == _manifest.main.playAnim?.animationGroupName);
                    if (idx >= 0) {
                        entries.animationGroups[idx].start(true, _manifest.main.playAnim.speed);
                    }
                }
                else {
                    entries.animationGroups[0].start(true);
                }
            }

            const processes = [];
            // 메터리얼 변경 , 툴일 경우는 무시한다
            if (this._assetLoader && false === this._assetLoader.isIgnoreModelMaterialChange()) {
                if (_manifest.main.materials && this._materialManager) {
                    for (let ii = 0; ii < _manifest.main.materials.length; ++ii) {
                        const info = _manifest.main.materials[ii];
                        let targetMesh: BABYLON.AbstractMesh | null = null;

                        //targetMesh 찿기
                        for (let mm = 0; mm < result.meshes.length; ++mm) {
                            const mesh = result.meshes[mm];
                            const targetMeshPath = mesh.name;

                            if (info.targetMeshPath === targetMeshPath) {
                                targetMesh = mesh;
                                break;
                            }

                            if (mesh.name === "__root__") {
                                targetMesh = mesh.getChildMeshes().find((childMesh) => childMesh.name === info.targetMeshPath) || null;
                                if (targetMesh) {
                                    break;
                                }
                            }
                        }

                        //메터리얼 생성하기
                        //로딩 속도를 위해서 await 처리하지 않는다. (by ulralra)
                        if (targetMesh) {
                            const process = async () => {
                                if (targetMesh) targetMesh.visibility = 0.03;

                                const materialJson = await this._assetLoader?.loadManifest<IAssetManifest_Material>(eAssetType.Model_glb, assetInfo.assetId, info.materialName + ".json");
                                if (materialJson && this._materialManager && targetMesh) {
                                    if (materialJson.main.materialType === "NodeMaterial") {
                                        if (targetMesh.numBoneInfluencers > 4) {
                                            targetMesh.numBoneInfluencers = 4;
                                        }
                                        const chanageMaterial = await this._materialManager.makeNodeCloneMaterial(convertStringToNodeMaterialType(materialJson.main.data.type), info.materialName, materialJson.main.data, this._packageFileLoader, assetInfo.assetId);
                                        if (chanageMaterial) {
                                            if (targetMesh) targetMesh.material = chanageMaterial;
                                        }
                                        else {
                                            console.error(`AssetUnitLoader_Model_glb.loadAssetUnit() => chanageMaterial is null. assetId = ${assetInfo.assetId}, materialType =${materialJson.main.materialType}, materialName = ${info.materialName}`);
                                        }
                                    }
                                    else {
                                        //Node가 아닌경우는 바로 source 메터리얼에 값을 적용한다. Clone 하게되면 texture가 2배가 될수 있기 때문에
                                        if (targetMesh && targetMesh.material) {
                                            targetMesh.material.name = info.materialName;
                                            this._materialManager.modifyPBRMaterial(targetMesh.material as BABYLON.PBRMaterial, materialJson.main.data, this._packageFileLoader, assetInfo.assetId);
                                        }
                                        else {
                                            console.error(`AssetUnitLoader_Model_glb.loadAssetUnit() => targetMesh.material is null. assetId = ${assetInfo.assetId}, materialName = ${info.materialName}`);
                                        }
                                    }
                                }
                                else {
                                    console.error(`AssetUnitLoader_Model_glb.loadAssetUnit() => materialJson is null. assetId = ${assetInfo.assetId}, materialName = ${info.materialName}`);
                                }

                                if (targetMesh) targetMesh.visibility = 1;
                            };
                            processes.push(process());
                        }
                        else {
                            console.error(`AssetUnitLoader_Model_glb.loadAssetUnit() => targetMesh is null. assetId = ${assetInfo.assetId}, targetMeshPath = ${info.targetMeshPath}`);
                        }
                    }
                }
            }

            // 이것을 먼저해준다. 그래야 밖에서, 아바타 의상관련 skinning처리를 한다.
            essentialLoaded?.(result);

            if (processes.length > 0) await Promise.all(processes);


            // particle을 필수적으로 로딩완료해야 되는것은 아니므로, await 처리하지 않는다. (by ulralra)
            // 혹시나 await가 필요하면 변경가능.
            const rootNodeUniqueId = ((entries.rootNodes && entries.rootNodes.length > 0) ? entries.rootNodes[0].uniqueId : 0);
            PostAssetLoader.load(ELoadPostAssetWhen.ModelGlb, this._assetLoader!, assetInfo.assetId, this._scene!, rootNodeUniqueId);

            return result;
        }

        return null;
    }

    clearCache(): void {
        this._assetContainerCache.forEach((container) => {
            container.dispose();
        });
        this._assetContainerCache.clear();
    }
}