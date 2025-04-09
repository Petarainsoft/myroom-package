import fs from 'fs'; 
import path from 'path';
import { ItemBuilderErrorThen } from "../misc/itemBuilderErrorThen";
import { CacheData_Current, CacheData_History, ERegisteResult } from "./defineBuildCache";
import { ItemBuilderParams } from "../misc/itemBuilderParams";
import { ItemMetaData, ItemData } from '../../../../packages/client-core/tableData/defines/System_Interface';
import { ItemBuilderUtil } from '../misc/itemBuilderUtil';
import { TableDataManagerNoRuntime } from '../buildProcess/tableDataManagerNoRuntime';
import { ItemBuildProcessor } from '../buildProcess/itemBuildProcessor';

export class CacheDataController
{
    private readonly CACHE_VALID_FILENAME:string = "cache_valid.json";
    private readonly CACHE_DELETE_FILENAME:string = "cache_delete.json";
    
    private historyValidDatas: {[key: string]: CacheData_History} = {};
    private historyDeletedDatas: {[key: string]: CacheData_History} = {};
    
    public currentValidDatas: {[key: string]: CacheData_Current} = {};
    public currentDeletedDatas: {[key: string]: CacheData_Current} = {};

    private dataManager: TableDataManagerNoRuntime;

    constructor(tableData:TableDataManagerNoRuntime)
    {
        this.dataManager = tableData;
    }

    public initialize()
    {
        this.clearCache();
    }

    private clearCache(): void
    {
        this.historyValidDatas = {};
        this.historyDeletedDatas = {};
        
        this.currentValidDatas = {};
        this.currentDeletedDatas = {};
    }

    public loadHistoryDatas()
    {
        const cacheRoot = ItemBuilderParams.getRoot_ItemBuild_Cache();

        const validFilePath:string = path.join(cacheRoot, this.CACHE_VALID_FILENAME);
        const deleteFilePath:string = path.join(cacheRoot, this.CACHE_DELETE_FILENAME);

        this.historyValidDatas = this.loadLocalJson<CacheData_History>(validFilePath);
        this.historyDeletedDatas = this.loadLocalJson<CacheData_History>(deleteFilePath);

        console.log("CacheDataController::loadHistoryDatas() valid count = " + Object.keys(this.historyValidDatas).length);
        console.log("CacheDataController::loadHistoryDatas() deleted count = " + Object.keys(this.historyDeletedDatas).length);
    }

    public saveHistoryDatas()
    {
        const cacheRoot = ItemBuilderParams.getRoot_ItemBuild_Cache();

        const validFilePath:string = path.join(cacheRoot, this.CACHE_VALID_FILENAME);
        const deleteFilePath:string = path.join(cacheRoot, this.CACHE_DELETE_FILENAME);

        ItemBuilderUtil.makeDirectories(cacheRoot);
        this.writeLocalJson(validFilePath, JSON.stringify(this.historyValidDatas, null, 2));
        this.writeLocalJson(deleteFilePath, JSON.stringify(this.historyDeletedDatas, null, 2));

        // for check data
        const currValidFilePath:string = path.join(cacheRoot, "curr_valid.json");
        const currDeleteFilePath:string = path.join(cacheRoot, "curr_delete.json");
        this.writeLocalJson(currValidFilePath, JSON.stringify(this.currentValidDatas, null, 2));
        this.writeLocalJson(currDeleteFilePath, JSON.stringify(this.currentDeletedDatas, null, 2));
    }

    public loadCurrentDatas()
    {
        this.loadCurrentData(this.dataManager.registeItems, this.currentValidDatas, true);
        this.loadCurrentData(this.dataManager.unregisteItems, this.currentDeletedDatas, false);
        
        console.log("CacheDataController::loadCurrentDatas() valid count = " + Object.keys(this.currentValidDatas).length);
        console.log("CacheDataController::loadCurrentDatas() deleted count = " + Object.keys(this.currentDeletedDatas).length);
    }

    public loadCurrentData(excelItemDic:{ [key: string]: ItemMetaData; }, currentDataDic:{[key: string]: CacheData_Current}, isRegiste:boolean)
    {
        for (const key in excelItemDic)
        {
            const itemMeta = excelItemDic[key];
            //console.log(`CacheDataController::loadCurrentData() key='${key}', data=${JSON.stringify(item)}`);

            const itemData = this.dataManager.getItemData(isRegiste, itemMeta.Key, itemMeta.ItemStructName);

            console.log(`CacheDataController::loadCurrentData() key='${key}', itemStructType='${itemMeta.ItemStructName}'`);
            console.log(`CacheDataController::loadCurrentData() key='${key}', itemStructType='${itemMeta.ItemStructName}', itemData='${JSON.stringify(itemData)}'`);
            if (!itemData)
            {
                throw `CacheDataController::loadCurrentData() Invalid item data. key='${key}', itemStructType='${itemMeta.ItemStructName}'`;
            }

            const data = new CacheData_Current(key, itemMeta.ItemStructName, itemData, []);

            if (currentDataDic.hasOwnProperty(key))
            {
                const msg = `CacheDataController::loadCurrentData() Duplicated ID. item id = '${key}'`;
                if (ItemBuilderErrorThen.EXIST_DUPLICATED_ITEM_ID_THEN_THROW)
                {
                    throw msg;
                }
                else
                {
                    console.error(`[Skipped] ${msg}`);
                    continue;
                }
            }
            
            currentDataDic[key] = data;
        }
    }

    public getHistoryValidData(key:string): CacheData_History | null
    {
        if (!key)
            return null;

        if (!this.historyValidDatas.hasOwnProperty(key))
            return null;

        return this.historyValidDatas[key];
    }

    public getHistoryDeletedData(key:string): CacheData_History | null
    {
        if (!key)
            return null;

        if (!this.historyDeletedDatas.hasOwnProperty(key))
            return null;
        
        return this.historyDeletedDatas[key];
    }

    public setAlreadyRegisted(currData:CacheData_Current)
    {
        if (!currData)
            return;

        currData.registeResult   = ERegisteResult.AlreadyRegisted;
        currData.errorString     = "";
    }

    public succeededRegiste(currData:CacheData_Current, isValidDataHistory:boolean)
    {
        if (!currData)
            return;

        currData.registeResult   = ERegisteResult.SucceededRegiste;
        currData.errorString     = "";

        const historyDatas = isValidDataHistory ? this.historyValidDatas : this.historyDeletedDatas;
        
        if (historyDatas.hasOwnProperty(currData.ID))
        {
            historyDatas[currData.ID].itemStructName    = currData.itemStructName;
            historyDatas[currData.ID].metadata          = currData.metadata;
            historyDatas[currData.ID].resource          = currData.resource;
        }
        else
        {
            const historyData = new CacheData_History(currData.ID, currData.itemStructName, currData.metadata, currData.resource);
            historyDatas[currData.ID] = historyData;
        }
    }

    public failedRegiste(currData:CacheData_Current, registeResult:ERegisteResult, error:string)
    {
        const enumString = `${ERegisteResult[registeResult]}`;
        console.error(`CacheDataController::failedRegiste() [${enumString}(${registeResult})] => ${error}`);

        if (!currData)
            return;

        currData.registeResult   = registeResult;
        currData.errorString     = error;
    }

    private loadLocalJson<T>(path:string): { [key: string]: T; }
    {
        try
        {
            if (!fs.existsSync(path))
            {
                const dic: { [key: string]: T; } = {};
                return dic;
            }

            const fileData = fs.readFileSync(path, 'utf8');
            const dic: { [key: string]: T; } =  this._convertTo<T>(JSON.parse(fileData));
            return dic;
        }
        catch (error)
        {
            console.error(`CacheDataController::loadLocalJson() failed load json file. path = '${path}' \n${error}`);
            throw error;
        }
    }

    private writeLocalJson(path:string, json:string)
    {
        try
        {
            fs.writeFileSync(path, json);
        }
        catch (error)
        {
            console.error(`CacheDataController::writeLocalJson() failed write json file. path = '${path}' \n${error}`);
            throw error;
        }
    }

    private _convertTo<T>(jsonData: any): { [key: string]: T; } {
        const dic: { [key: string]: T; } = {};

        if (typeof jsonData === 'object' && !Array.isArray(jsonData))
        {
            for (const key in jsonData)
            {
                if (jsonData.hasOwnProperty(key))
                {
                    const item: T = jsonData[key] as T;
                    dic[key] = item;
                }
                else
                {
                    console.error(`CacheDataController::_convertTo() Invalid hasOwnProperty`);
                }
            }
        }
        else
        {
            console.error(`CacheDataController::_convertTo() Invalid json type`);
        }

        return dic;
    }
}