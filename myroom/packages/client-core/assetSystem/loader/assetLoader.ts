import { Nullable } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";
import { IAssetLoader, eAssetType, IAssetPackageFileLoader, IAssetLoadingResult } from "../definitions";
import { AssetPackageFileLoader } from "../package/assetPackageFileLoader";
import { Constants } from "../constants";
import { AssetUtils } from "../assetUtils";
import { IAssetManifest } from "../jsonTypes/manifest/assetManifest";
import { IAssetManifest_Item } from "../jsonTypes/manifest/assetManifest_Item";
import { eAssetUnit, IAssetUnitLoader } from "./unitLoader/assetUnitLoader";
import { AssetUnitLoader_Model_glb } from "./unitLoader/assetUnitLoader_Model_glb";
import { IVirtualItemTreeNode, VirtualItemTreeBuilder } from "./nodeProcessors/virtualItemTreeBuilder";
import { MetadataProcessor } from "./nodeProcessors/metadataProcessor";
import { IAssetManifest_Avatar } from "../jsonTypes/manifest/assetManifest_Avatar";
import { AvatarController } from "../controllers/avatarController";
import { IAssetManifest_MyRoom } from "../jsonTypes/manifest/assetManifest_MyRoom";
import { MyRoomController } from "../controllers/myRoomController";
import axios from "axios";
import { MyRoomContext } from "../myRoomContext";
import { IAssetPackageInfo } from "../jsonTypes/assetPackageInfo";

//---------------------------------------------------------------------------------------
// Interanl Types
//---------------------------------------------------------------------------------------
interface IAssetLoadingContext {
    result: IAssetLoadingResult,

    assetInfo: {
        assetType: eAssetType,
        assetId: string,
    },
    parent: Nullable<BABYLON.Node>,
}

//---------------------------------------------------------------------------------------
// AssetLoader
//---------------------------------------------------------------------------------------
export class AssetLoader implements IAssetLoader {
    private _packageFileLoader: Nullable<IAssetPackageFileLoader> = null;
    private _scene: Nullable<BABYLON.Scene> = null;
    private _assetUnitLoaders = new Map<string, IAssetUnitLoader>();
    private _myRoomContext: MyRoomContext;
    private _ignoreMaterialChange: boolean = false;

    constructor(roomContext: MyRoomContext, scene: Nullable<BABYLON.Scene> = null, ignoreMaterialChange: boolean = false) {
        this._myRoomContext = roomContext;
        this._ignoreMaterialChange = ignoreMaterialChange;
        this._scene = scene || BABYLON.EngineStore.LastCreatedScene;
        if (this._scene) {
            this._packageFileLoader = AssetPackageFileLoader.getInstance();
        }

        this._assetUnitLoaders.set(eAssetUnit.Model_glb, new AssetUnitLoader_Model_glb(this._scene, this._packageFileLoader, this._myRoomContext.getNodeMaterialManager(), this));
    }

    async loadAssetIntoScene(assetType: eAssetType, assetId: string, parent?: Nullable<BABYLON.Node>): Promise<IAssetLoadingResult> {
        let context: IAssetLoadingContext = {
            result: {
                errors: [],
                loadedObjects: {
                    meshes: [],
                    particleSystems: [],
                    skeletons: [],
                    animationGroups: [],
                    transformNodes: [],
                    geometries: [],
                    lights: []
                }
            },
            assetInfo: {
                assetType,
                assetId
            },
            parent: parent ?? null,
        };

        if (this._scene) {
            const manifest = await this.loadManifest<IAssetManifest>(assetType, assetId);
            if (manifest) {
                const manifestType = eAssetType[manifest.main.type as keyof typeof eAssetType];
                switch (manifestType) {
                    case eAssetType.Avatar:
                        await this._loadAssetIntoScene_Avatar(manifest, context);
                        break;
                    case eAssetType.MyRoom:
                        await this._loadAssetIntoScene_MyRoom(manifest, context);
                        break;
                    case eAssetType.Item:
                    case eAssetType.Land:
                        await this._loadAssetIntoScene_Item(manifest, context);
                        break;
                    case eAssetType.Enviroment:
                        console.error("AssetLoader.loadAssetIntoScene() => use loadManifest() function!!!"); //단순 json 같은 경우는 씬에 올릴 데이터가 없다!!
                        break;
                    default:
                        await this._loadAssetIntoScene_Asset(manifest, context);
                        break;
                }
            }
        }

        await this._postProcessForCreatedNodes(context);

        return context.result;
    }
    async getPackageInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null | undefined> {
        return this._packageFileLoader?.getPackageInfo(assetType, assetId);
    }

    async loadManifest<T>(assetType: eAssetType, assetId: string, filename: string | undefined = undefined): Promise<T | null> {
        try {
            switch (assetType) {
                case eAssetType.Avatar: return await this._loadManifest_Avatar(assetId);//IAssetManifest_Avatar
                case eAssetType.MyRoom: return await this._loadManifest_MyRoom(assetId);//IAssetManifest_MyRoom
                default:
                    if (this._packageFileLoader) {
                        const objectUrl = await this._packageFileLoader.loadFile(assetType, assetId, filename || Constants.MANIFEST_FILENAME);
                        //console.log(`assetLoader::loadManifest() objectUrl = ${objectUrl}`);
                        return await AssetUtils.readJsonFromUrl<T>(objectUrl);
                    }
                    else {
                        console.error(`AssetLoader.loadManifest() Invalid PackageFileLoader.`);
                    }
                    break;
            }
        }
        catch (e) {
            console.error(`AssetLoader.loadManifest() => assetType='${assetType}', assetId='${assetId}' \n exception: ${e} `);
            return null;
        }

        return null;
    }

    async clearCache(): Promise<void> {
        //await this._packageFileLoader?.clearCache();
        this._assetUnitLoaders.forEach(loader => {
            loader.clearCache();
        });
    }

    isIgnoreModelMaterialChange(): boolean {
        return this._ignoreMaterialChange;
    }

    private async _loadManifest_Avatar<T>(assetId: string): Promise<T | null> {
        
        // anhnguyen
        const mainfest_avatar = {
            "format": 3,
            "main": {
                "type": "Avatar",
                
                "skeleton":"34aDyVneHDnaCDEY6gW9Me",
                "equipments":[
                // "30oEzvPCKJvlr5k4Cqi6pk",
                // "32hEXHCDWw0KlE3JOu1Vmi",
                "34aDyVneHDnaCDEY6gW9Me"
                ]		
            }
        };


        

        return mainfest_avatar as T;
        const url = `${Constants.BASEURL_API}/space/avatars/${assetId}`;

        try {
            //console.log(`assetLoader::_loadManifest_Avatar() assetId='${assetId}'`);

            const headers = AssetUtils.makeHeader(true, "", true, "");
            const params = { avatar_id: assetId };
            const response = await axios.get(url, { headers: headers, params: params });
            const resData = response.data;

            //console.log('_loadManifest_Avatar() res11 : ', resData);

            //console.log('_loadManifest_Avatar() res1-1 : ', resData.data.resource.manifest);
            // console.log(`assetLoader::_loadManifest_Avatar() :
            // avarar_id='${assetId}'
            // version='${resData.data.option.version}'
            // manifest='${resData.data.resource.manifest}'
            // resData='${JSON.stringify(resData)}'
            // `);

            const params2 = { avatar_id: assetId, version: resData.data.option.version };
            const response2 = await axios.get(resData.data.resource.manifest, { headers: headers, params: params2 });
            //const response2 = await axios.get(resData.data.resource.manifest, { headers: headers });
            const resData2 = response2.data;

            //console.log('_loadManifest_Avatar() res2 : ',  JSON.stringify(resData2));
            return resData2 as T;
        }
        catch (error: any) {
            AssetUtils.printError("assetLoader::_loadManifest_Avatar()", error, url);
            return null;
        }
    }

    private async _loadManifest_MyRoom<T>(assetId: string): Promise<T | null> {
        const url = `${Constants.BASEURL_API}/space/myrooms/${assetId}`;

        try {
            //console.log(`assetLoader::_loadManifest_MyRoom() assetId='${assetId}'`);

            const headers = AssetUtils.makeHeader(true, "", true, "");
            const params = { myroom_id: assetId };
            const response = await axios.get(url, { headers: headers, params: params });
            const resData = response.data;

            //console.log('_loadManifest_MyRoom() res11 : ', resData);

            //console.log('_loadManifest_MyRoom() res1-1 : ', resData.data.resource.manifest);
            const params2 = { avatar_id: assetId, version: resData.data.option.version };
            const response2 = await axios.get(resData.data.resource.manifest, { headers: headers, params: params2 });
            //const response2 = await axios.get(resData.data.resource.manifest, { headers: headers });
            const resData2 = response2.data;

            //console.log('_loadManifest_MyRoom() res2 : ',  JSON.stringify(resData2));
            return resData2 as T;
        }
        catch (error: any) {
            AssetUtils.printError("assetLoader::_loadManifest_MyRoom()", error, url);
            return null;
        }
    }



    //-----------------------------------------------------------------------------------
    // loadAssetIntoScene Avatar
    //-----------------------------------------------------------------------------------
    private async _loadAssetIntoScene_Avatar(manifest: IAssetManifest, context: IAssetLoadingContext): Promise<void> {
        const mainfest_avatar = manifest as IAssetManifest_Avatar;
        if (mainfest_avatar) {
            //AvataController 추가
            const controller = new AvatarController(context.assetInfo.assetId, this._scene, this, this._myRoomContext, null);
            //load Model
            await controller.loadModelFromManifest(mainfest_avatar);
        }
    }

    public async loadAvatarAsset(assetId: string, avatarAssetLoadResultHandler: (result: Nullable<BABYLON.ISceneLoaderAsyncResult>) => void): Promise<void> {
        const objectUrl = await this._packageFileLoader!.loadFile(eAssetType.Model_glb, assetId, Constants.MANIFEST_FILENAME);
        const manifest = await AssetUtils.readJsonFromUrl<IAssetManifest>(objectUrl);
        if (manifest) {
            const result = await this._loadAssetIntoScene_Asset_helper(manifest, { assetType: eAssetType.Model_glb, assetId }, undefined, avatarAssetLoadResultHandler);
        }
    }

    //-----------------------------------------------------------------------------------
    // loadAssetIntoScene Room
    //-----------------------------------------------------------------------------------
    private async _loadAssetIntoScene_MyRoom(manifest: IAssetManifest, _context: IAssetLoadingContext): Promise<void> {
        const manifest_myroom = manifest as IAssetManifest_MyRoom;
        if (manifest_myroom) {

            //RoomController 추가
            const controller = new MyRoomController(this._scene, this, this._myRoomContext);
            await controller.initModel(manifest_myroom.main.room.backgroundColor, manifest_myroom.main.room.roomSkinId, manifest_myroom.main.room.grids, manifest_myroom.main.environment || "");

            //items 처리
            if (manifest_myroom.main.items) {
                controller.placeItems(manifest_myroom.main.items);
            }

            //figures 처리
            if (manifest_myroom.main.figures) {
                controller.placeFigures(manifest_myroom.main.figures, false);
            }

            //Item function 처리
            if (manifest_myroom.main.itemFunctionDatas) {
                manifest_myroom.main.itemFunctionDatas.forEach(data => {
                    controller.doItemFunction(data.instanceId, data);
                });
            }
        }
    }

    //-----------------------------------------------------------------------------------
    // loadAssetIntoScene Item
    //-----------------------------------------------------------------------------------
    private async _loadAssetIntoScene_Item(manifest: IAssetManifest, context: IAssetLoadingContext): Promise<void> {
        const treeNodeBuilder = new VirtualItemTreeBuilder(this._packageFileLoader);
        const rootNodes = await treeNodeBuilder.build(manifest as IAssetManifest_Item, context.assetInfo.assetType, context.assetInfo.assetId);

        console.log(`AssetLoader._loadAssetIntoScene_Item() => IAssetManifest_Item id=${context.assetInfo.assetId}`);

        for (let ii = 0; ii < rootNodes.length; ++ii) {
            const node = rootNodes[ii];
            await this._createSceneNode_recusively(node, context);
        }
    }

    private async _createSceneNode_recusively(node: IVirtualItemTreeNode, context: IAssetLoadingContext): Promise<void> {
        let createdMesh: Nullable<BABYLON.AbstractMesh> = null;
        if (node.asset.id === "" || node.asset.type === "Item") {
            createdMesh = new BABYLON.AbstractMesh(node.values.name);
        }
        else {
            const assetType = AssetUtils.convertStringToAssetType(node.asset.type);
            const assetId = node.asset.id;

            const objectUrl = await this._packageFileLoader!.loadFile(assetType, assetId, Constants.MANIFEST_FILENAME);
            const manifest = await AssetUtils.readJsonFromUrl<IAssetManifest>(objectUrl);
            if (manifest) {
                const importResult = await this._loadAssetIntoScene_Asset_helper(manifest, { assetType, assetId }, context.parent);
                if (importResult) {
                    // AssetUnitLoader_Model_glb 안에서 glb 로딩할때 처리함. (by ulralra)
                    // importResult.meshes.forEach(mesh => {
                    //     if (mesh.parent === null) {
                    //         mesh.parent = context.parent;
                    //     }
                    // });
                    this._mergeSceneImportResult(context, importResult);
                    if (importResult.meshes.length > 0) {
                        createdMesh = importResult.meshes[0];
                        createdMesh.name = node.values.name;
                    }
                }
            }
        }

        if (createdMesh) {
            createdMesh.parent = context.parent;
            createdMesh.position = node.values.pos;
            if (createdMesh.rotationQuaternion) {
                createdMesh.rotationQuaternion = createdMesh.rotationQuaternion?.multiply(node.values.rot);
            }
            else {
                createdMesh.rotationQuaternion = node.values.rot;
            }
            createdMesh.scaling = createdMesh.scaling.multiply(node.values.scale);
            createdMesh.metadata = node.metadata;

            for (let ii = 0; ii < node.children.length; ++ii) {
                context.parent = createdMesh;
                context.assetInfo = { assetId: node.asset.id, assetType: AssetUtils.convertStringToAssetType(node.asset.type) };
                await this._createSceneNode_recusively(node.children[ii], context);
            }
        }

        context.parent = null;
        context.assetInfo = { assetType: eAssetType.None, assetId: "" };
    }

    //-----------------------------------------------------------------------------------
    // loadAssetIntoScene Asset
    //-----------------------------------------------------------------------------------
    private async _loadAssetIntoScene_Asset(manifest: IAssetManifest, context: IAssetLoadingContext): Promise<void> {
        if (manifest) {
            let importResult = await this._loadAssetIntoScene_Asset_helper(manifest, context.assetInfo, context.parent);
            if (importResult) {
                // AssetUnitLoader_Model_glb 안에서 glb 로딩할때 처리함. (by ulralra)
                // importResult.meshes.forEach(mesh => {
                //     if (mesh.parent === null) {
                //         mesh.parent = context.parent;
                //     }
                // });
                this._mergeSceneImportResult(context, importResult);
            }
        }
    }

    private async _loadAssetIntoScene_Asset_helper(manifest: IAssetManifest, assetInfo: { assetType: eAssetType, assetId: string; }, parent?: Nullable<BABYLON.Node>, essentialLoaded?: (result: Nullable<BABYLON.ISceneLoaderAsyncResult>) => void): Promise<Nullable<BABYLON.ISceneLoaderAsyncResult>> {
        let unitLoader: IAssetUnitLoader | undefined = undefined;

        if (manifest) {
            if (this._assetUnitLoaders.get(manifest.main.type)) {
                unitLoader = this._assetUnitLoaders.get(manifest.main.type);
            }
        }

        if (unitLoader) {
            return await unitLoader.loadAssetUnit(manifest, assetInfo, parent, essentialLoaded);
        }

        console.error(`AssetLoader._loadAssetIntoScene_Asset_helper() => not found unitLoader for '${manifest.main.type}'`);
        return null;
    }

    //-----------------------------------------------------------------------------------
    // 노드 생성후 후처리 작업
    //-----------------------------------------------------------------------------------
    private async _postProcessForCreatedNodes(context: IAssetLoadingContext): Promise<void> {
        for (let ii = 0; ii < context.result.loadedObjects.lights.length; ++ii) {
            const node = context.result.loadedObjects.lights[ii];
            await MetadataProcessor.processMetadata(node);
        }

        for (let ii = 0; ii < context.result.loadedObjects.meshes.length; ++ii) {
            const node = context.result.loadedObjects.meshes[ii];
            await MetadataProcessor.processMetadata(node);
        }

        for (let ii = 0; ii < context.result.loadedObjects.transformNodes.length; ++ii) {
            const node = context.result.loadedObjects.transformNodes[ii];
            await MetadataProcessor.processMetadata(node);
        }
    }


    //-----------------------------------------------------------------------------------
    // Mesh Import Result 합치기
    //-----------------------------------------------------------------------------------
    private _mergeSceneImportResult(context: IAssetLoadingContext, importResult: BABYLON.ISceneLoaderAsyncResult): void {
        const meshes = context.result.loadedObjects.meshes.concat(importResult.meshes);
        const particleSystems = context.result.loadedObjects.particleSystems.concat(importResult.particleSystems);
        const skeletons = context.result.loadedObjects.skeletons.concat(importResult.skeletons);
        const animationGroups = context.result.loadedObjects.animationGroups.concat(importResult.animationGroups);
        const transformNodes = context.result.loadedObjects.transformNodes.concat(importResult.transformNodes);
        const geometries = context.result.loadedObjects.geometries.concat(importResult.geometries);
        const lights = context.result.loadedObjects.lights.concat(importResult.lights);

        const result = {
            meshes: meshes,
            particleSystems: particleSystems,
            skeletons: skeletons,
            animationGroups: animationGroups,
            transformNodes: transformNodes,
            geometries: geometries,
            lights: lights,
        };

        context.result.loadedObjects = result; //이게 최선인가?
    }

    //-----------------------------------------------------------------------------------
    // Print Virtual Item Tree (Debug용)
    //-----------------------------------------------------------------------------------
    /*
    private _printVirtualItemTree(node: IVirtualItemTreeNode): void {
        if (node) {
            let debug = { msg: "" }
            this._makeVirtualItemTreeNodeDegugText(node, debug, 0)
            console.log("Virtual Item Tree : -----------------------")
            console.log(debug.msg)
            console.log("-------------------------------------------\n\n")
        }
    }

    private _makeVirtualItemTreeNodeDegugText(node: IVirtualItemTreeNode, debug: { msg: string }, depth: number = 0): void {
        if (node) {
            debug.msg += '-'.repeat(depth)
            debug.msg += `${node.values.name} ${node.indexPath}\n`
            node.children.forEach(n => {
                this._makeVirtualItemTreeNodeDegugText(n, debug, depth + 1)
            })
        }
    }
    */
}


