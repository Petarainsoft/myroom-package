import { Mesh, StandardMaterial, BaseTexture, TransformNode, ParticleSystem, HandConstraintBehavior, PBRMaterial } from "@babylonjs/core";
import { Material } from "@babylonjs/core";
import { AbstractScene } from "@babylonjs/core";
import { AssetContainer } from "@babylonjs/core";
import { Geometry } from "@babylonjs/core";
import { Nullable } from "@babylonjs/core";
import { Scene } from "@babylonjs/core";

export class ParticleLoader {
    public static readonly SETUP_NODE_NAME: string = "파티클설정";
    public static readonly FILENAME: string = "savedParticles";
    public static readonly EXTENSION: string = "particle";
    public static readonly ROOT_PARTICLE_NAME: string = "ROOT_PARTICLE";

    private static readonly _useDebugLog:boolean = false;
    private static readonly _useCollectTexture:boolean = true;

    public static loadParticles(scene: Nullable<Scene>, json: any): AssetContainer|null
    {
        if (!scene) {
            console.error("ParticleLoader::loadParticles() : invalid Scene.!!");
            return null;
        }

        const container = new AssetContainer(scene);

        this._loadMeshes(scene, json, container);

        if (json.autoAnimate) {
            scene.beginAnimation(scene, json.autoAnimateFrom, json.autoAnimateTo, json.autoAnimateLoop, json.autoAnimateSpeed || 1.0);
        }

        AbstractScene.Parse(json, scene, container, "");

        if (this._useCollectTexture)
        {
            container.particleSystems.forEach((i) => {
                const ps = i as ParticleSystem;
                container.textures.push(...this.getParticleSystemTexture("from loadParticles()", ps));
            });
        }

        if (this._useDebugLog)
        {
            console.log(`ParticleLoader::loadParticles() : 
            ${container.meshes.length} meshes, 
            ${container.particleSystems.length} particleSystems, 
            ${container.textures.length} textures, 
            ${container.materials.length} materials, 
            ${container.transformNodes.length} transformNodes, 
            ${container.geometries.length} geometries`);
        }

        return container;
    }

    private static _loadMeshes(scene: Scene, jsonData: any, container: AssetContainer) {
        //console.log(`ParticleLoader::_loadMeshes() ${JSON.stringify(jsonData)}`);

        if (jsonData.materials)
        {
            for (const material of jsonData.materials)
            {
                if (scene.getMaterialByName(material.name))
                    continue;

                const m = Material.Parse(material, scene, "");
                if (m)
                {
                    container.materials.push(m);

                    if (this._useCollectTexture)
                    {
                        container.textures.push(...this.getTexturesFromMaterial(`materials - ${m.name}`, m));
                    }
                }
            }
        }

        if (jsonData.geometries) {
            const geometries = jsonData.geometries;
            const vertexData = geometries.vertexData;

            if (vertexData !== undefined && vertexData !== null) {
                let index: number;
                let cache: number;

                for (index = 0, cache = vertexData.length; index < cache; index++) {
                    const parsedVertexData = vertexData[index];
                    const g = Geometry.Parse(parsedVertexData, scene, "");
                    if (g)
                    {
                        container.geometries.push(g);
                        g.meshes.forEach((m) => {
                            container.meshes.push(m);

                            if (this._useCollectTexture)
                            {
                                container.textures.push(...this.getTexturesFromMaterial("geometries", m.material as Material));
                            }
                        });
                    }
                }
            }

            container.geometries.forEach((g) => {
                if (g) {
                    container.geometries.push(g);
                    g._parentContainer = container;
                }
            });
        }

        if (jsonData.meshes)
        {
            for (const mesh of jsonData.meshes)
            {
                const m = Mesh.Parse(mesh, scene, "");
                if (m)
                {
                    container.meshes.push(m);
                    if (m.material && this._useCollectTexture)
                    {
                        container.textures.push(...this.getTexturesFromMaterial(`materials - ${m.name}`, m.material));
                    }
                }
            }
        }

        if (jsonData.transformNodes)
        {
            for (const node of jsonData.transformNodes)
            {
                if (node.name === ParticleLoader.SETUP_NODE_NAME)
                    continue;

                container.transformNodes.push(TransformNode.Parse(node, scene, ""));

                if (this._useCollectTexture)
                {
                    container.textures.push(...node.textures);
                }
            }
        }

        //------------------------------------------------
        // binding meshes.
        //------------------------------------------------
        this._bindingByUUID(scene, jsonData, container);
    }

    private static _bindingByUUID(scene: Scene, jsonData: any, container: AssetContainer)
    {
        if (jsonData.meshes) {
            for (const mesh of jsonData.meshes) {
                const me = this._findContainerByUUID(container, mesh.cUUID) as Mesh;
                if (!me)
                    continue;

                // binding hierachy of meshes.
                if (mesh.cParentName) {
                    me.setParent(this._findContainerByUUID(container, mesh.cParentUUID) as TransformNode);
                }

                // binding active material of meshes.
                if (mesh.cMaterialName) {
                    me.material = scene.getMaterialByName(mesh.cMaterialName);
                }
            }
        }

        if (jsonData.transformNodes) {
            for (const node of jsonData.transformNodes) {
                const me = this._findContainerByUUID(container, node.cUUID) as TransformNode;
                if (!me)
                    continue;

                // binding hierachy of nodes.
                if (node.cParentName) {
                    me.setParent(this._findContainerByUUID(container, node.cParentUUID) as TransformNode);
                }
            }
        }
    }

    static _findContainerByUUID = (container: AssetContainer, uuid: any) => {

        let parent = container.meshes.find(e => e.metadata.cUUID === uuid);
        if (parent)
            return parent;

        return container.transformNodes.find(e => e.metadata.cUUID === uuid);
    };

    private static getTexturesFromMaterial(debug:string, material: Material): BaseTexture[]
    {
        const result: BaseTexture[] = [];

        if (material instanceof StandardMaterial) {
            const standardMat = material as StandardMaterial;

            if (standardMat.ambientTexture) result.push(standardMat.ambientTexture);
            if (standardMat.diffuseTexture) result.push(standardMat.diffuseTexture);
            if (standardMat.specularTexture) result.push(standardMat.specularTexture);
            if (standardMat.emissiveTexture) result.push(standardMat.emissiveTexture);
            if (standardMat.lightmapTexture) result.push(standardMat.lightmapTexture);
            if (standardMat.reflectionTexture) result.push(standardMat.reflectionTexture);
            if (standardMat.refractionTexture) result.push(standardMat.refractionTexture);
            if (standardMat.bumpTexture) result.push(standardMat.bumpTexture);
            if (standardMat.opacityTexture) result.push(standardMat.opacityTexture);

            // ... and any other textures specific to StandardMaterial
        } else if (material instanceof PBRMaterial) {
            const pbrMat = material as PBRMaterial;

            if (pbrMat.albedoTexture) result.push(pbrMat.albedoTexture);
            if (pbrMat.ambientTexture) result.push(pbrMat.ambientTexture);
            if (pbrMat.reflectivityTexture) result.push(pbrMat.reflectivityTexture);
            if (pbrMat.microSurfaceTexture) result.push(pbrMat.microSurfaceTexture);
            if (pbrMat.bumpTexture) result.push(pbrMat.bumpTexture);
            if (pbrMat.lightmapTexture) result.push(pbrMat.lightmapTexture);
            if (pbrMat.refractionTexture) result.push(pbrMat.refractionTexture);
            if (pbrMat.metallicTexture) result.push(pbrMat.metallicTexture);
            if (pbrMat.emissiveTexture) result.push(pbrMat.emissiveTexture);
            if (pbrMat.opacityTexture) result.push(pbrMat.opacityTexture);
            // if (pbrMat.environmentBRDFTexture) result.push(pbrMat.environmentBRDFTexture);
            
            // ... and any other textures specific to PBRMaterial
        }

        if (this._useDebugLog)
        {
            console.log(`ParticleLoader::getTexturesFromMaterial() : [${debug}] ${result.length}`);
        }
        
        // Filter out any null values from the result
        const textures = result.filter(texture => texture !== null);

        if (this._useDebugLog)
        {
            textures.forEach(texture => {
                console.log(`ParticleLoader::getTexturesFromMaterial() > [${debug}] ${texture.name}`);
                if (texture.name === "data:EnvironmentBRDFTexture1")
                {
                    console.warn(`ParticleLoader::getTexturesFromMaterial() > [${debug}] textureName='${texture.name}', materialName='${material.name}'`);
                }
            });
        }
        
        return textures;

    }
    
    private static getParticleSystemTexture(debug:string, particleSystem: ParticleSystem): BaseTexture[]
    {
        const textures: BaseTexture[] = [];
        
        if (particleSystem.particleTexture) {
            textures.push(particleSystem.particleTexture);
        }
        
        if (this._useDebugLog)
        {
            console.log(`ParticleLoader::getParticleSystemTexture() : [${debug}] ${textures.length}`);
            textures.forEach(texture => {
                console.log(`ParticleLoader::getParticleSystemTexture() > [${debug}] ${texture.name}`);
            });
        }

        return textures;
    }
}