import * as BABYLON from "@babylonjs/core";
import { Nullable, Scene } from '@babylonjs/core';
import axios from 'axios';
import { Constants } from '../constants';
import { ParticleLoader } from '../controllers/particleSubSystem/particleLoader';
import { ParticleController } from "../controllers/particleController";
import { IAssetLoader, eAssetType } from "../definitions";
import { IAssetPackageInfo } from "../jsonTypes/assetPackageInfo";

export enum EPostAssetType
{
    LOAD_PARTICLE = 'particle'
}

export enum ELoadPostAssetWhen
{
    ModelGlb,
    Parts,
    Animation
}

interface IPostAssetResult {
    particleControllers: ParticleController[];
}

export class PostAssetLoader
{
    public static async load(when:ELoadPostAssetWhen, assetLoader:IAssetLoader, assetId:string, scene:Scene, rootNodeUniqueId:number) : Promise<Nullable<IPostAssetResult>>
    {
        const getFileName = (() => {

            switch (when)
            {
                case ELoadPostAssetWhen.ModelGlb:  return Constants.POSTASSETS_FILENAME_WHEN_PROB;
                case ELoadPostAssetWhen.Parts:     return Constants.POSTASSETS_FILENAME_WHEN_PARTS;
                case ELoadPostAssetWhen.Animation: return Constants.POSTASSETS_FILENAME_WHEN_ANIM;
            }

            return "";
        });

        const postAssetFileName = getFileName();
        if (!postAssetFileName)
        {
            console.error(`PostAssetLoader::load() invalid postAssetFileName. ELoadPostAssetWhen = ${when}`);
            return null;
        }

        return await this._loadPostAssets(assetLoader, assetId, postAssetFileName, scene, rootNodeUniqueId);
    }

    private static async _loadPostAssets(assetLoader:IAssetLoader, assetId:string, postAssetFileName:string, scene:Scene, rootNodeUniqueId:number) : Promise<Nullable<IPostAssetResult>>
    {
        if (!assetLoader)
            return null;

        if (rootNodeUniqueId <= 0)
            return null;

        const packageInfo = await assetLoader.getPackageInfo(eAssetType.Model_glb, assetId);
        if (!packageInfo)
            return null;

        if (!packageInfo.files.includes(postAssetFileName)) 
            return null;

        const itemRootUrl       = packageInfo.baseUrl;
        const postAssetUrl      = this._makeUrl(itemRootUrl, postAssetFileName);
        const loadedDatas:any   = await this._loadJsonFromCDN(postAssetUrl);

        if (!loadedDatas)
            return null;

        const result:IPostAssetResult={
            particleControllers: []
        }

        for (const d of loadedDatas)
        {
            switch (d.postAssetType)
            {
                case EPostAssetType.LOAD_PARTICLE:
                    {
                        const particleController = await this._loadParticleAsset(scene, rootNodeUniqueId, itemRootUrl, d.data.fileName, d.data.myName, d.data.jsonParams);
                        if (particleController)
                        {
                            result.particleControllers.push(particleController);
                        }
                    } break;
            }
        }

        return result;
    }

    private static async _loadParticleAsset(scene:Scene, rootNodeUniqueId:number, itemRootUrl: string, fileName: string, myName:string, jsonParams: string) : Promise<Nullable<ParticleController>>
    {
        const particleData = await this._loadJsonFromCDN(this._makeUrl(itemRootUrl, fileName));
        if (!particleData)
            return null;

        const controller = new ParticleController(myName, scene, rootNodeUniqueId, particleData, jsonParams);

        await controller.initParticle();
        const particleContaier = controller.getAssetContainer();

        if (!particleContaier)
        {
            controller.dispose();
            return null;
        }

        const rootParticleNode = particleContaier.meshes.find(m => m && m.name === ParticleLoader.ROOT_PARTICLE_NAME);
        if (!rootParticleNode)
        {
            particleContaier.meshes.forEach(m => {
                if (m)
                {
                    console.log(`PostAssetLoader::_loadParticle() mesh name = ${m.name}`);
                }
            });
            console.error(`PostAssetLoader::_loadParticle() invalid rootParticleNode. rootParticleNode name is ${ParticleLoader.ROOT_PARTICLE_NAME}!!`);
        }

        return controller;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //  utils...
    ///////////////////////////////////////////////////////////////////////////////////////////////
    private static _makeUrl(rootUrl:string, fileName:string):string
    {
        const separator = rootUrl.endsWith('/') ? '' : '/';
        return `${rootUrl}${separator}${fileName}`;
    }

    private static async _loadJsonFromCDN(url:string):Promise<any>
    {
        try {
            const response = await axios.get(url);
            const jsonData = response.data;
            //console.log(`PostAssetLoader::_loadJsonFromCDN() ${JSON.stringify(manifest)}`);
            return jsonData;
        }
        catch (error) {
            console.error(`PostAssetLoader::_loadJsonFromCDN() Failed load json. url='${url}', Error downloading JSON file='${error}'`);
            throw error;
        }
    }
}