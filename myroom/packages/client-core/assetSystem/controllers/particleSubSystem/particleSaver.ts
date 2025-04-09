import { AbstractMesh, ConditionBlockTests, CopyTools, Nullable } from "@babylonjs/core";
import { Scene, TransformNode } from "@babylonjs/core";
import { SceneSerializer } from "@babylonjs/core";
import { ParticleLoader } from "./particleLoader";
import { Tools } from "@babylonjs/core";
import { v4 as uuidv4 } from 'uuid';

export class ParticleSaver
{
    public static saveFile(scene: Scene, rootParticleNode:AbstractMesh|undefined, isSerializeTexture:boolean)
    {
        if (!scene)
        {
            console.error("ParticleSaver::saveFile() : invalid Scene.!!");
            return null;
        }

        if (!rootParticleNode)
        {
            console.error("ParticleSaver::saveFile() : invalid 'ROOT_PARTICLE'.!!");
            return null;
        }

        scene.particleSystems.forEach(ps => {
            if (ps.emitter !== rootParticleNode) {
                ps.emitter = rootParticleNode;
                console.log(`ParticleSaver::saveFile() : change emitter. emitter name = ${ps.emitter.name}`);
            }
        });

        let serialized = SceneSerializer.Serialize(scene);

        this._excludeJsonData(serialized);
        this._setUUIDFromScene(scene);

        this._reAppendMeshes(scene, serialized);
        this._reTransformNodes(scene, serialized);
        this._reAppendParticleSystems(scene, serialized, isSerializeTexture);

        const particleData = {
            particleInfo: serialized
        };

        const jsonData = JSON.stringify(particleData, null, 2);

        const blob = new Blob([jsonData], { type: "application/json" });

        const path = ParticleLoader.FILENAME + "." + ParticleLoader.EXTENSION;
        Tools.Download(blob, path);
    }

    private static _setUUIDFromScene(scene: Scene)
    {
        // 메시에 UUID 할당
        scene.meshes.forEach(mesh => {
            mesh.metadata = mesh.metadata || {};
            mesh.metadata.cUUID = mesh.metadata.cUUID || uuidv4();
        });

        // 머티리얼에 UUID 할당
        scene.materials.forEach(material => {
            material.metadata = material.metadata || {};
            material.metadata.cUUID = material.metadata.cUUID || uuidv4();
        });

        // 텍스처에 UUID 할당
        scene.textures.forEach(texture => {
            texture.metadata = texture.metadata || {};
            texture.metadata.cUUID = texture.metadata.cUUID || uuidv4();
        });

        // 트랜스폼 노드에 UUID 할당
        scene.transformNodes.forEach(transformNode => {
            transformNode.metadata = transformNode.metadata || {};
            transformNode.metadata.cUUID = transformNode.metadata.cUUID || uuidv4();
        });
    }

    public static loadFile(scene: Scene, file: File) {
        Tools.ReadFile(file, (data) => {
            ParticleLoader.loadParticles(scene, JSON.parse(data));

            // example for transform
            // const rootMesh = this.loadWithJson(JSON.parse(data), this._scene);
            // rootMesh.position.x = 3;
            // rootMesh.rotation.x = -90;
        });
    }


    private static _reAppendMeshes(scene: Scene, jsonData: any) {
        delete jsonData['meshes'];

        if (!scene.meshes)
            return;

        let bucket = [];

        const meshes = scene.meshes;
        const count = meshes.length;

        for (let index = 0; index < count; index++) {
            const mesh = meshes[index];
            if (!this._isChildOfRootParticle(mesh))
                continue;

            let pJson = mesh.serialize();

            pJson["cUUID"] = pJson.metadata.cUUID;

            if (mesh.parent) {
                pJson["cParentName"] = mesh.parent.name;
                pJson["cParentUUID"] = mesh.parent.metadata.cUUID;
            }

            if (mesh.material) {
                pJson["cMaterialName"] = mesh.material.name;
                pJson["cMaterialUUID"] = mesh.material.metadata.cUUID;
            }


            bucket.push(pJson);
        }

        jsonData["meshes"] = bucket;
    }

    private static _reTransformNodes(scene: Scene, jsonData: any) {
        delete jsonData['transformNodes'];

        if (!scene.meshes)
            return;

        let bucket = [];

        const nodes = scene.transformNodes;
        const count = nodes.length;

        for (let index = 0; index < count; index++) {
            const node = nodes[index];

            if (!this._isChildOfRootParticle(node))
                continue;

            let pJson = node.serialize();

            pJson["cUUID"] = pJson.metadata.cUUID;

            if (node.parent) {
                pJson["cParentName"] = node.parent.name;
                pJson["cParentUUID"] = node.parent.metadata.cUUID;
            }

            bucket.push(pJson);
        }

        jsonData["transformNodes"] = bucket;
    }

    private static _reAppendParticleSystems(scene: Scene, jsonData: any, isSerializeTexture:boolean) {
        delete jsonData['particleSystems'];

        if (!scene.particleSystems)
            return;

        let bucket = [];

        const pSystems = scene.particleSystems;
        const count = pSystems.length;

        for (let index = 0; index < count; index++) {
            const particle = pSystems[index];
            let pJson = particle.serialize(isSerializeTexture);

            if (particle.particleTexture && isSerializeTexture) {
                const tex = CopyTools.GenerateBase64StringFromTexture(particle.particleTexture) || "";
                if (tex)
                    pJson.texture.url = tex;
            }

            if (particle.noiseTexture && isSerializeTexture) {
                const tex = CopyTools.GenerateBase64StringFromTexture(particle.noiseTexture) || "";
                if (tex)
                    pJson.noiseTexture.url = tex;
            }

            bucket.push(pJson);
        }

        jsonData["particleSystems"] = bucket;
    }

    private static _excludeJsonData(serialized: any) {
        delete serialized["autoClear"];
        delete serialized["clearColor"];
        delete serialized["ambientColor"];
        delete serialized["gravity"];
        delete serialized["collisionsEnabled"];
        delete serialized["useRightHandedSystem"];
        delete serialized["morphTargetManagers"];
        delete serialized["lights"];
        delete serialized["cameras"];
        delete serialized["activeCameraID"];
        delete serialized["shadowGenerators"];
        delete serialized["cameras"];
        delete serialized["animationGroups"];
        delete serialized["environmentTexture"];
        delete serialized["environmentIntensity"];
        delete serialized["skeletons"];
        delete serialized["postProcesses"];
        delete serialized["sounds"];
        delete serialized["effectLayers"];
    }

    private static _isChildOfRootParticle(mesh: TransformNode): boolean {
        if (mesh.name === ParticleLoader.ROOT_PARTICLE_NAME)
            return true;

        if (mesh.parent) {
            return this._isChildOfRootParticle(mesh.parent as TransformNode);
        }

        return false;
    }
}