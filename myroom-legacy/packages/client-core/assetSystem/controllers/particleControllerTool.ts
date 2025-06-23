import * as BABYLON from "@babylonjs/core";
import { ParticleLoader } from "./particleSubSystem/particleLoader";
import { AbstractMesh } from "@babylonjs/core";
import { ParticleSaver } from "./particleSubSystem/particleSaver";
import { ParticleController } from "./particleController";
import { Nullable } from "@babylonjs/core";

export class ParticleControllerTool extends BABYLON.TransformNode
{
    private _sampleNode: Nullable<AbstractMesh> = null;
    private _rootParticleNode: AbstractMesh | undefined = undefined;

    public constructor(scene?: BABYLON.Nullable<BABYLON.Scene>)
    {
        super(ParticleLoader.SETUP_NODE_NAME, scene);

        this.inspectableCustomProperties = [];
        this._createCustomProperies_Panel();

        const box = BABYLON.MeshBuilder.CreateBox('box', { size: 0.1 }, scene);
        box.position = BABYLON.Vector3.Zero();
        box.material = new BABYLON.StandardMaterial('whiteMat', scene!);
    }
    
    //-----------------------------------------------------------------------------------
    // CreateCustomProperties
    private _createCustomProperies_Panel() {
        this.inspectableCustomProperties.push({
            label: "파티클 제작메뉴",
            propertyName: "",
            type: BABYLON.InspectableType.Tab,
        });
        this.inspectableCustomProperties.push({
            label: "Create AbstractMesh",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                if (!this._rootParticleNode) {
                    this._rootParticleNode = new AbstractMesh(ParticleLoader.ROOT_PARTICLE_NAME, this._scene);
                }
            },
        });
        this.inspectableCustomProperties.push({
            label: "Create ParticleSystem for SheetAnimation",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                if (this._rootParticleNode) {
                    const ps = new BABYLON.ParticleSystem("ps", 1000, this._scene);
                    ps.particleTexture = new BABYLON.Texture("", this._scene, true, false);
                    ps.start();
                }
                else{
                    console.error(`ParticleControllerTool::_createCustomProperies_Panel() : ${ParticleLoader.ROOT_PARTICLE_NAME} is null.!!`);
                }
            },
        });
        this.inspectableCustomProperties.push({
            label: "Save Particles",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                ParticleSaver.saveFile(this._scene,this._rootParticleNode, true);
            },
        });


        this.inspectableCustomProperties.push({
            label: "",
            propertyName: "",
            type: BABYLON.InspectableType.Tab,
        });
        this.inspectableCustomProperties.push({
            label: "파티클 테스트 메뉴",
            propertyName: "",
            type: BABYLON.InspectableType.Tab,
        });
        this.inspectableCustomProperties.push({
            label: "Load Particles",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) =>
            {
                BABYLON.Tools.ReadFile(file, async (data) =>
                {
                    const particleData = JSON.parse(data);
                    if (particleData && 'particleInfo' in particleData)
                    {
                        this._clearParticle();
                        await this._createParticle(particleData);
                    }
                    else
                    {
                        console.error(`ParticleControllerTool::_createCustomProperies_Panel() : invalid data.!! ${JSON.stringify(particleData,null, 2)}`); 
                    }
                });
            },
            accept: "." + ParticleLoader.EXTENSION
        });
        this.inspectableCustomProperties.push({
            label: "Remove Particles",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this._clearParticle();
            },
        });
    }

    private _clearParticle()
    {
        if (this._sampleNode)
        {
            this._sampleNode.dispose();
            this._sampleNode = null;
        }
    }

    private async _createParticle(particleData: any)
    {
        const rootMesh = this._scene.meshes.find(e => e.name === ParticleLoader.ROOT_PARTICLE_NAME);
        if (rootMesh) {
            rootMesh.dispose();
        }

        const controller = new ParticleController("loadedParticle", this._scene, -1, particleData);
        await controller.initParticle();
    }
}