// import fs from 'fs'; 
import path from 'path';
import _isEqual from 'lodash/isEqual';

import { ItemData } from "../../../../packages/client-core/tableData/defines/System_Interface";
import { TableDataManagerNoRuntime } from "./tableDataManagerNoRuntime";
import { ItemBuilderParams } from "../misc/itemBuilderParams";
import { CacheDataController } from "../buildCache/cacheDataController";
import { ERegisteResult } from '../buildCache/defineBuildCache';
import { ItemBuilderPath } from '../misc/itemBuilderPath';
import { ItemBuilderUtil } from '../misc/itemBuilderUtil';
import { EItemCategory3, EManifestType } from '../../../../packages/client-core/tableData/defines/System_Enum';
import { GenManifestFile_ModelGlb } from '../genManifest/genManifestFile_ModelGlb';
import { GenManifestFile_None } from '../genManifest/genManifestFile_None';
import { GenPackageFile } from '../misc/genPackageFile';
import { Constants } from '../../../../packages/client-core/assetSystem/constants';
import { BackendAPI, RefError } from './backendAPI';
import { AssetPackageInfoQuery } from '../../../../packages/client-core/assetSystem/package/assetPackageInfoQuery';
import { ChangedItemDataPrinter } from '../misc/changedItemDataPrinter';
import { ItemBuildResultPrinter } from '../misc/itemBuildResultPrinter';
import { ItemBuilderErrorThen } from '../misc/itemBuilderErrorThen';


export class ItemBuildProcessor
{
    public dataManager:TableDataManagerNoRuntime;
    public deletedItems: { [key: string]: ItemData; } = {};

    public cacheDataController: CacheDataController;

    constructor()
    {
        ItemBuilderParams.Initialize();

        this.dataManager = new TableDataManagerNoRuntime();
        this.cacheDataController = new CacheDataController(this.dataManager);
    }

    public async process_DiffrentData()
    {
        await this.initialize();

        console.log(`[ItemBuildProcessor::process_DiffrentData()] ----------- loadcache.`);
        await this.loadCache();

        console.log(`[ItemBuildProcessor::process_DiffrentData()] ----------- runPrebuild_Item.`);
        await this.runPrebuild_Item();

        console.log(`[ItemBuildProcessor::process_DiffrentData()] ----------- runListupRegisteDatas.`);
        await this.runListupRegisteDatas();

        console.log(`[ItemBuildProcessor::process_DiffrentData()] ----------- print changed datas.`);    
        await ChangedItemDataPrinter.print(this.cacheDataController);
    }

    public async process_RegisteData()
    {
        console.log(`[ItemBuildProcessor::process_RegisteData()] ----------- runBuild_Item.`);
        await this.runBuild_Item();

        console.log(`[ItemBuildProcessor::process_RegisteData()] ----------- runRegiste.`);
        await this.runRegiste();

        console.log(`[ItemBuildProcessor::process_RegisteData()] ----------- print item build result.`);
        await ItemBuildResultPrinter.print(this.cacheDataController);

        console.log(`[ItemBuildProcessor::process_RegisteData()] ----------- run writeCache.`);
        await this.writeCache();
    }

    private async initialize()
    {
        //await this.dataManager.loadTableDatas();
        const jsonRoot = ItemBuilderParams.getRoot_Work_JsonData();
        await this.dataManager.loadTableDatasForLocalMode(jsonRoot);
        await this.cacheDataController.initialize();

        await ItemBuilderUtil.removeDirectory(ItemBuilderParams.getBuildRoot());
        await ItemBuilderUtil.makeDirectories(ItemBuilderPath.getItemBuildTempRoot());
        await ItemBuilderUtil.makeDirectories(ItemBuilderPath.getItemBuildZipRoot());
    }

    private async loadCache()
    {
        this.cacheDataController.loadHistoryDatas();
        this.cacheDataController.loadCurrentDatas();
    }

    private async writeCache()
    {
        this.cacheDataController.saveHistoryDatas();
    }

    private async runPrebuild_Item(): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));

        const itemSrcPaths = new Map<string, string>();

        for (const key in this.cacheDataController.currentValidDatas)
        {
             const currData = this.cacheDataController.currentValidDatas[key];
            // if (!currData.isNeedUploadResource)
            //     continue;

            const item = this.dataManager.getItemData(true, currData.ID, currData.itemStructName);
            if (!item)
            {
                const desc:string = `Not found ItemData. item_id='${key}'`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }

            if (!item.client_itemid)
            {
                const desc:string = `Empty client_itemid. item id=${key}.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }

            const strCategory3 = item.category3.toString();
            const category3 = this.dataManager.findCategory3(strCategory3);
            if (!category3)
            {
                const desc:string = `Empty category3. item id=${key}.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }


            const itemDirName = ItemBuilderUtil.getFolderName(item, category3);
            if (!itemDirName)
            {
                const desc:string = `Invalid resource folder name. item_id='${key}' client_itemid='${item.client_itemid}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }

            const itemSvnRoot = ItemBuilderPath.getSvnItemPath(item, category3);
            const itemDstRoot = ItemBuilderPath.getTempItemRoot(item, category3);

            if (!ItemBuilderUtil.isExistPath(itemSvnRoot))
            {
                const desc:string = `Not found original resource path. item_id='${key}' path='${itemSvnRoot}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }

            // 아이템 경로는 같지만 카테고리가 다른경우 에러로 처리합니다.
            if (itemSrcPaths.has(itemSvnRoot))
            {
                if (itemSrcPaths.get(itemSvnRoot) !== strCategory3)
                {
                    const desc:string = `Duplicated source path of different types. item_id='${key}', item.client_itemid='${itemSvnRoot}', item.category3='${item.category3}'`;
                    this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                    continue;
                }
            }
            itemSrcPaths.set(itemSvnRoot, strCategory3);

            await ItemBuilderUtil.makeDirectories(itemDstRoot);
            if (!ItemBuilderUtil.isExistPath(itemDstRoot))
            {
                const desc:string = `Not found destination temp resource path. item_id='${key}' path='${itemDstRoot}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }

            if (ItemBuilderUtil.copyFiles(itemSvnRoot, itemDstRoot))
            {
                const desc:string = `Faild resource copy. item_id='${key}', src_path='${itemSvnRoot}', dst_path='${itemDstRoot}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }
            
            const manifestType: number = +category3.ManifestType;
            switch (manifestType)
            {
                case EManifestType.MODEL:   
                    {
                        const manifestPath = ItemBuilderPath.getTempItemManifestPath(item, category3);
                        if (ItemBuilderUtil.isExistPath(manifestPath))
                        {
                            console.log(`ItemBuildProcessor::runPrebuild_Item() already exist manifest file. item_id='${key}' path='${manifestPath}'.`);
                        }
                        else
                        {
                            const glbPath = path.join(itemSvnRoot, `${item.client_itemid}.glb`);
                            if (!ItemBuilderUtil.isExistPath(glbPath))
                            {
                                const desc:string = `Not found '${item.client_itemid}.glb'. item_id='${key}' path='${glbPath}'.`;
                                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                            }
                            await GenManifestFile_ModelGlb.Generate(itemDstRoot, item, category3);
                        }
                    } break;
                case EManifestType.BALLOON:
                    {
                        await GenManifestFile_None.Generate(itemDstRoot, item, category3); break;
                    }
            }

            // lerp한 체크로 itemDstRoot에 최소 manifest.json하나라도 존재해야 하므로 manifest.json 없으면 실패처리.
            const manifestDstPath = ItemBuilderPath.getTempItemManifestPath(item, category3);
            if (!ItemBuilderUtil.isExistPath(manifestDstPath))
            {
                const desc:string = `Not found ${Constants.MANIFEST_FILENAME}. item_id='${key}' path='${manifestDstPath}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }
            //------------------------------------------------------------

            const resourceInfoArray = ItemBuilderUtil.makeChecksumList(itemDstRoot)
            if (!resourceInfoArray)
            {
                const desc:string = `Invalid CacheData_ResourceInfo[]. item_id='${key}' path='${manifestDstPath}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }
            this.cacheDataController.currentValidDatas[key].resource = resourceInfoArray;

            await GenPackageFile.Generate(item, category3);
            const packageDstPath = ItemBuilderPath.getTempItemPackagePath(item, category3);
            if (!ItemBuilderUtil.isExistPath(packageDstPath))
            {
                const desc:string = `Not found ${Constants.ASSET_PACKAGE_INFO_FILENAME}. item_id='${key}' path='${packageDstPath}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedPreBuildItem, desc);
                continue;
            }
        }
    }

    private async runListupRegisteDatas(): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));

        for (const key in this.cacheDataController.currentValidDatas)
        {
            let currData = this.cacheDataController.currentValidDatas[key];
            if (currData.registeResult >= ERegisteResult.SucceededRegiste)
                continue;

            const historyData = this.cacheDataController.getHistoryValidData(key);

            if (historyData)
            {
                if (!_isEqual(currData.metadata, historyData.metadata))
                {
                    console.log(`BuildCacheHandler::listupRegisteDatas() diffrent metadata. ID='${key}'`);
                    currData.isNeedUpdateItem = true;
                }

                //if (!_isEqual(currData.resource, historyData.resource))
                if (!_isEqual(JSON.stringify(currData.resource), JSON.stringify(historyData.resource)))
                {
                    console.log(`BuildCacheHandler::listupRegisteDatas() diffrent resource. ID='${key}'
                    before: ${JSON.stringify(currData.resource)}
                    afterr: ${JSON.stringify(historyData.resource)}`);
                    currData.isNeedUpdateItem = true;
                    currData.isNeedUploadResource = true;
                }
            }
            else
            {
                console.log(`BuildCacheHandler::listupRegisteDatas() new item. ID='${key}'`);
                currData.isNeedRegisteItem = true;
                currData.isNeedUploadResource = true;
            }

            if (!currData.isNeedRegisteItem && !currData.isNeedUpdateItem && !currData.isNeedUploadResource)
            {
                this.cacheDataController.setAlreadyRegisted(currData);
            }
        }

        for (const key in this.cacheDataController.currentDeletedDatas)
        {
            let currData        = this.cacheDataController.currentDeletedDatas[key];
            const historyData   = this.cacheDataController.getHistoryDeletedData(key);

            if (!historyData)
            {
                currData.isNeedDeleteItem = true;
            }

            if (!currData.isNeedDeleteItem)
            {
                this.cacheDataController.setAlreadyRegisted(currData);
            }
        }
    }

    private async runBuild_Item(): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));

        for (const key in this.cacheDataController.currentValidDatas)
        {
            const currData = this.cacheDataController.currentValidDatas[key];
            if (currData.registeResult >= ERegisteResult.SucceededRegiste)
                continue;

            if (!currData.isNeedUploadResource)
                continue;

            const item = this.dataManager.getItemData(true, currData.ID, currData.itemStructName);
            if (!item)
            {
                const desc:string = `Not found ItemData. item_id='${key}'`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedBuildItem, desc);
                continue;
            }

            const category3 = this.dataManager.findCategory3(item.category3.toString());
            if (!category3)
            {
                const desc:string = `Invalid category3. item id=${key}.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedBuildItem, desc);
                continue;
            }

            const itemDstRoot = ItemBuilderPath.getTempItemRoot(item, category3);
            if (!ItemBuilderUtil.isExistPath(itemDstRoot))
            {
                const desc:string = `Not found destination temp resource path. item_id='${key}' path='${itemDstRoot}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedBuildItem, desc);
                continue;
            }

            const zipFilePath = ItemBuilderPath.getZipDstPath(item, category3);
            const itemZipRoot = path.dirname(zipFilePath);
            await ItemBuilderUtil.makeDirectories(itemZipRoot);

            await ItemBuilderUtil.createZipFile(itemDstRoot, zipFilePath);
            if (!ItemBuilderUtil.isExistPath(zipFilePath))
            {
                const desc:string = `Failed create zip file. item_id='${key}' path='${zipFilePath}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedBuildItem, desc);
                continue;
            }
        }
    }

    private async runRegiste(): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));
        
        let refError:RefError = {msg:""};
        
        const api = new BackendAPI();
        if (!await api.login())
        {
            process.exit(1);
        }

        for (const key in this.cacheDataController.currentValidDatas)
        {
            const currData = this.cacheDataController.currentValidDatas[key];
            if (currData.registeResult >= ERegisteResult.SucceededRegiste)
                continue;

            const item = this.dataManager.getItemData(true, currData.ID, currData.itemStructName);
            if (!item)
            {
                const desc:string = `Not found ItemData. item_id='${key}'`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedUploadResource, desc);
                continue;
            }

            let version: number = -1;

            if (currData.isNeedUploadResource)
            {
                const category3 = this.dataManager.findCategory3(item.category3.toString());
                if (!category3)
                {
                    const desc:string = `Invalid category3. item id=${key}.`;
                    this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedUploadResource, desc);
                    continue;
                }
                
                const zipFilePath = ItemBuilderPath.getZipDstPath(item, category3);
                const resourceInfo = await api.uploadResource(item, zipFilePath, refError);
                if (!resourceInfo)
                {
                    const apiErr = `\n  => api_result='${refError.msg}`;
                    const desc:string = `Failed upload zip file. item_id='${key}' path='${zipFilePath}'. ${apiErr}`;
                    this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedUploadResource, desc);
                    continue;
                }
                version = resourceInfo.version;
            }
            else
            {
                const resData = await AssetPackageInfoQuery.RequestAssetInfo(item.ID);
                version = resData.option.version as number;
            }

            if (version < 1)
            {
                const desc:string = `Invalid Item version. item_id='${key}'.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedUploadResource, desc);
                continue;
            }


            if (currData.isNeedRegisteItem)
            {
                const data = api.makeUpdateItemInfo(item, version);
                if (!await api.registeItem(item, data, refError))
                {
                    const apiErr = `\n  => api_result='${refError.msg}`;
                    const desc:string = `Failed call registeitem api. item_id='${key}'. ${apiErr}`;
                    this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedRegisteItem, desc);
                    continue;
                }
            }
            else if (currData.isNeedUpdateItem)
            {
                const data = api.makeUpdateItemInfo(item, version);
                if (!await api.updateItem(item, data, refError))
                {
                    const apiErr = `\n  => api_result='${refError.msg}`;
                    const desc:string = `Failed call updateitem api. item_id='${key}'. ${apiErr}`;
                    this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedRegisteItem, desc);
                    continue;
                }
            }
            else
            {
                const desc:string = `No call api => registeItem() or updateItem(). item_id='${key}'`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedRegisteItem, desc);
                continue;
            }

            const resData = await AssetPackageInfoQuery.RequestAssetInfo(item.ID);
            const getVersion = resData.option.version as number;
            if (version !== getVersion)
            {
                const desc:string = `Failed diffrent version. item_id='${key}', uploadResourceVersion:${version}, getItemVersion:${getVersion}.`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedRegisteItem, desc);
                continue;
            }
            
            this.cacheDataController.succeededRegiste(currData, true);
        }
        

        for (const key in this.cacheDataController.currentDeletedDatas)
        {
            const currData = this.cacheDataController.currentDeletedDatas[key];
            if (currData.registeResult >= ERegisteResult.SucceededRegiste)
                continue;

            const item = this.dataManager.getItemData(false, currData.ID, currData.itemStructName);
            if (!item)
            {
                const desc:string = `Not found nouse ItemData. item_id='${key}'`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedDeleteItem, desc);
                continue;
            }

            if (!await api.deleteItem(item, refError))
            {
                const apiErr = `\n  => api_result='${refError.msg}`;
                const desc:string = `Failed call deleteitem api. item_id='${key}'. ${apiErr}`;
                this.cacheDataController.failedRegiste(currData, ERegisteResult.FailedDeleteItem, desc);
                continue;
            }

            this.cacheDataController.succeededRegiste(currData, false);
        }
    }

    public hasErrorThen(forBuild:boolean)
    {
        if (ItemBuilderErrorThen.EXIST_FAILED_ITEM_THEN_BUILD_FAILURE)
        {
            if (this.hasFaildItem(forBuild))
            {
                console.error(`ItemBuildProcessor::hasErrorThen() hasFaildItem()`);
                process.exit(1);
                //this.writeForceBuildFailureFile();
            }
        }
    }

    private hasFaildItem(forBuild:boolean):boolean
    {
        let valiadFailureCount = 0;
        let deleteFailureCount = 0;

        if (forBuild)
        {
            const vliadFailureList = Object.values(this.cacheDataController.currentValidDatas)
                .filter(item => item.registeResult !== ERegisteResult.SucceededRegiste &&
                                item.registeResult !== ERegisteResult.AlreadyRegisted)
                .map(item => item);

            const deleteFailureList = Object.values(this.cacheDataController.currentDeletedDatas)
                .filter(item => item.registeResult !== ERegisteResult.SucceededRegiste &&
                                item.registeResult !== ERegisteResult.AlreadyRegisted)
                .map(item => item);

            valiadFailureCount = Object.keys(vliadFailureList).length;
            deleteFailureCount = Object.keys(deleteFailureList).length;
        }
        else
        {
            const vliadFailureList = Object.values(this.cacheDataController.currentValidDatas)
                .filter(item => item.registeResult > ERegisteResult.AlreadyRegisted)
                .map(item => item);

            const deleteFailureList = Object.values(this.cacheDataController.currentDeletedDatas)
                    .filter(item => item.registeResult > ERegisteResult.AlreadyRegisted)
                .map(item => item);

            valiadFailureCount = Object.keys(vliadFailureList).length;
            deleteFailureCount = Object.keys(deleteFailureList).length;
        }

        return (valiadFailureCount > 0 || deleteFailureCount > 0);
    }

    // private writeForceBuildFailureFile()
    // {
    //     const targetPath = path.join(ItemBuilderPath.getItemBuildTempRoot(), "force_build.failure");
    //     try
    //     {
    //         fs.writeFileSync(targetPath, "");
    //     }
    //     catch (error)
    //     {
    //         console.error(`ItemBuildProcessor::writeForceBuildFailureFile() failed write json file. path = '${path}' \n${error}`);
    //         throw error;
    //     }
    // }
}