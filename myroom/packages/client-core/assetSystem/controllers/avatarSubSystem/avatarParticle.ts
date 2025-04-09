import { ELoadPostAssetWhen, PostAssetLoader } from "../../postAssetLoader/postAssetLoader";
import { Constants } from "../../constants";
import { AvatarController } from "../avatarController";
import { AvatarEquipment } from "./avatarEquipment";
import { ParticleController } from "../particleController";

export class AvatarParticle
{
    private _owner: AvatarController;

    private _equipParticles: Map<string, ParticleController[]>;

    private _animationParticles: ParticleController[];

    public constructor(owner: AvatarController)
    {
        this._owner = owner;
        this._equipParticles = new Map<string, ParticleController[]>();
        this._animationParticles = [];
    }
    
    public finalize()
    {
        for (const particleControllers of this._equipParticles.values())
        {
            for (const particleController of particleControllers)
            {
                particleController.dispose();
            }
        }

        for (const particleController of this._animationParticles)
        {
            particleController.dispose();
        }
    }

    public async equipParts(assetId:string, isEquipCostume:boolean): Promise<void>
    {
        const slotName = AvatarEquipment.getSlotName(assetId);
        this.unequipParts(slotName);
        
        const assetLoader = this._owner.getAssetLoader();
        const scene = this._owner.getScene();
        const rootMeshUniqueId = this._owner.getSkinRootMesh().uniqueId;

        const result = await PostAssetLoader.load(ELoadPostAssetWhen.Parts, assetLoader, assetId, scene, rootMeshUniqueId);
        if (!result)
            return;

        //console.log(`AvatarParticle.equipParts() => assetId = ${assetId} , slotName = ${slotName}, particle count = '${result.particleControllers.length}'`);
        this._equipParticles.set(slotName, result.particleControllers);
        if (isEquipCostume)
        {
            result.particleControllers.forEach(p => {
                p.setVisible(false);
            });
        }
    }

    public unequipParts(slotName:string)
    {
        const particles = this._equipParticles.get(slotName);
        if (particles)
        {
            //console.log(`AvatarParticle.unequipParts() => slotName = ${slotName}, particle count = '${particles.length}'`);
            particles.forEach(p => {   
                p.dispose();
            });
        }

        //console.log(`AvatarParticle.unequipParts() => slotName = ${slotName}`);
        this._equipParticles.delete(slotName);
    }

    public setVisibleParts(slotName:string, show:boolean)
    {
        const particles = this._equipParticles.get(slotName);
        if (particles)
        {
            particles.forEach(p => {
                p.setVisible(show);
            });
        }
    }

    public async playAnimation(assetId:string): Promise<void>
    {
        this.stopAnimation();

        const assetLoader       = this._owner.getAssetLoader();
        const scene             = this._owner.getScene();
        const rootMeshUniqueId  = this._owner.getSkinRootMesh().uniqueId;

        const result = await PostAssetLoader.load(ELoadPostAssetWhen.Animation, assetLoader, assetId, scene, rootMeshUniqueId);
        if (!result)
            return;

        //console.warn(`AvatarParticle.playAnimation() => assetId = ${assetId}`);

        this._animationParticles = result.particleControllers;
    }

    public stopAnimation()
    {
        if (!this._animationParticles)
            return;

        //console.warn(`AvatarParticle.stopAnimation()`);

        this._animationParticles.forEach(p => {
            p.dispose();
        });
        this._animationParticles = [];
    }
}