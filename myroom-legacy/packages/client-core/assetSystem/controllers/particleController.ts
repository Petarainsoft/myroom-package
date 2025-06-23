import * as BABYLON from "@babylonjs/core";
import { Node } from "@babylonjs/core/node";
import { ParticleLoader } from "./particleSubSystem/particleLoader";
import { AssetContainer, Tools } from "@babylonjs/core";
import { Nullable } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class ParticleController extends BABYLON.TransformNode
{
    public static readonly KEY_PARAM_TARGET_NODE_NAME:string = "targetNodeName";
    public static readonly KEY_PARAM_POSITION:string = "position";
    public static readonly KEY_PARAM_ROTATION:string = "rotation";
    public static readonly KEY_PARAM_SCALE:string = "scale";

    private _assetContainer: Nullable<AssetContainer>;
    private _rootNodeUniqueId: number;

    private _particleData: any;
    private _parameters: any;

    public constructor(myName: string,
        scene: BABYLON.Nullable<BABYLON.Scene>, 
        rootNodeUniqueId: number,
        particleData: any,
        parameters: any = null)
    {
        super(myName, scene);

        this._assetContainer = null;
        this._rootNodeUniqueId = rootNodeUniqueId;

        this._particleData = particleData;
        this._parameters = parameters;

        this.onDispose = () => { this.finalize(); };
    }

    public finalize()
    {
        if (this._assetContainer)
        {
            this._assetContainer.dispose();
            this._assetContainer = null;
        }
    }

    public getAssetContainer(): Nullable<AssetContainer>
    {
        return this._assetContainer;
    }

    public setVisible(show:boolean)
    {
        this._assetContainer?.meshes.forEach(mesh => {
            mesh.isVisible = show;
        });

        this._assetContainer?.particleSystems.forEach(ps => {
            if (show)
                ps.start();
        else
                ps.stop();
        });
    }

    public async initParticle()
    {
        if (!this._particleData || !('particleInfo' in this._particleData))
        {
            console.error(`ParticleController.initParticle() : invalid ParticleData!!`);
            return;
        }

        this._assetContainer = ParticleLoader.loadParticles(this._scene, this._particleData.particleInfo);
        this._setFromParameters();
    }

    private _setFromParameters()
    {
        this._initDefaultParent();

        if (!this._parameters)
            return;

        this._setParent(this._parameters[ParticleController.KEY_PARAM_TARGET_NODE_NAME]);

        this._setPositionFromParam(this._parameters[ParticleController.KEY_PARAM_POSITION]);
        this._setRotationFromParam(this._parameters[ParticleController.KEY_PARAM_ROTATION]);
        this._setScaleFromParam(this._parameters[ParticleController.KEY_PARAM_SCALE]);
    }

    private _initDefaultParent()
    {
        if (!this._assetContainer)
            return;

        // 로드된 ROOT_PARTICLE mesh(파티클)는 ParticleController에 붙이고,
        const rootMesh = this._assetContainer.meshes.find(m => m.name === ParticleLoader.ROOT_PARTICLE_NAME);
        if (!rootMesh)
        {
            console.error(`ParticleController._initDefaultParent() : invalid rootMesh. rootMesh name is ${ParticleLoader.ROOT_PARTICLE_NAME}!!`);
            return;
        }
        rootMesh.parent = this;
    }

    private _setParent(targetNodeName:string)
    {
        // controller는 model_glb의 rootNode나 targetNode에 붙인다.
        if (this._rootNodeUniqueId)
        {
            const rootNode = this._scene.getMeshByUniqueId(this._rootNodeUniqueId);
            if (rootNode)
            {
                let targetNode: Node | undefined = undefined;
                if (targetNodeName)
                {
                    targetNode = rootNode.getDescendants(false).find(node => node.name === targetNodeName);
                    if (!targetNode)
                    {
                        console.error(`ParticleController.initParticle() : invalid targetNode. targetNode name is ${targetNodeName}!!`);
                    }
                }
                
                this.parent = targetNode || rootNode;
            }
            else
            {
                console.error(`ParticleController.initParticle() : invalid rootNode!!. rootNodeUniqueId is ${this._rootNodeUniqueId}!! `);
            }
        }
        else if (this._rootNodeUniqueId === -1)
        {
            // 정상 툴에서 호출된 경우
        }
        else
        {
            console.error(`ParticleController.initParticle() : invalid _rootNodeUniqueId!!`);
        }
    }

    private _setPositionFromParam(target: Vector3)
    {
        if (!target)
            return;

        this.position = new Vector3(target.x, target.y, target.z);
    }

    private _setRotationFromParam(target: Vector3)
    {
        if (!target)
            return;

        this.rotation = new Vector3(Tools.ToRadians(target.x), Tools.ToRadians(target.y), Tools.ToRadians(target.z));
    }

    private _setScaleFromParam(target: Vector3)
    {
        if (!target)
            return;

        this.scaling = new Vector3(target.x, target.y, target.z);
    }
}