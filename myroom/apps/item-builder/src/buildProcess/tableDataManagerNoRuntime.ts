import path from 'path';
import fs from 'fs'; 
import { Nullable } from "@babylonjs/core";
import { ItemMetaData, ItemData, ItemCategory1, ItemCategory2, ItemCategory3, BalloonResource, CameraSetting, OutSide, ItemGrid, DialogMain, DialogText, DialogResult } from "../../../../packages/client-core/tableData/defines/System_Interface";
import { TableDataManager } from "../../../../packages/client-core/tableData/tableDataManager";

export class TableDataManagerNoRuntime extends TableDataManager
{
    public noUseItems: { [key: string]: ItemData; } = {};
    public registeItems: { [key: string]: ItemMetaData; } = {};
    public unregisteItems: { [key: string]: ItemMetaData; } = {};

    async loadTableDatasForLocalMode(baseLocalPath: string): Promise<void>
    {
        const path_noUseItem = path.join(baseLocalPath, "item_deleted.json");
        const path_registeItems = path.join(baseLocalPath, "registeItems.json");
        const path_unregisteItems = path.join(baseLocalPath, "unregisteItems.json");

        const path_item = path.join(baseLocalPath, "item.json");
        const path_category1 = path.join(baseLocalPath, "EItemCategory1.json");
        const path_category2 = path.join(baseLocalPath, "EItemCategory2.json");
        const path_category3 = path.join(baseLocalPath, "EItemCategory3.json");
        const path_balloonResource = path.join(baseLocalPath, "BalloonResource.json");
        const path_cameraSetting = path.join(baseLocalPath, "CameraSetting.json");
        
        const path_outside = path.join(baseLocalPath, "CameraSetting.json");
        const path_itemgrid = path.join(baseLocalPath, "CameraSetting.json");
        const path_dialogMain = path.join(baseLocalPath, "CameraSetting.json");
        const path_dialogText = path.join(baseLocalPath, "CameraSetting.json");
        const path_dialogResult = path.join(baseLocalPath, "CameraSetting.json");

        this.noUseItems = await this._loadJsonFromFile<ItemData>(path_noUseItem);
        this.registeItems = await this._loadJsonFromFile<ItemMetaData>(path_registeItems);
        this.unregisteItems = await this._loadJsonFromFile<ItemMetaData>(path_unregisteItems);

        this.items = await this._loadJsonFromFile<ItemData>(path_item);
        this.category1 = await this._loadJsonFromFile<ItemCategory1>(path_category1);
        this.category2 = await this._loadJsonFromFile<ItemCategory2>(path_category2);
        this.category3 = await this._loadJsonFromFile<ItemCategory3>(path_category3);
        this.balloonResources = await this._loadJsonFromFile<BalloonResource>(path_balloonResource);
        this.cameraSetting = await this._loadJsonFromFile<CameraSetting>(path_cameraSetting);
        this.outsidePosList = await this._loadArrayFromFile<OutSide>(path_outside);
        this.itemgrids = await this._loadJsonFromFile<ItemGrid>(path_itemgrid);
        this.dialogMains = await this._loadJsonFromFile<DialogMain>(path_dialogMain);
        this.dialogTexts = await this._loadJsonFromFile<DialogText>(path_dialogText);
        this.dialogResults = await this._loadJsonFromFile<DialogResult>(path_dialogResult);

        const desc = `TableDataManagerNoRuntime::loadTableDatasForLocalMode()
        noUseItems count = ${Object.keys(this.noUseItems).length}
        registeItems count = ${Object.keys(this.registeItems).length}
        unregisteItems count = ${Object.keys(this.unregisteItems).length}

        item count = ${Object.keys(this.items).length}
        category1 count = ${Object.keys(this.category1).length}
        category2 count = ${Object.keys(this.category2).length}
        category3 count = ${Object.keys(this.category3).length}
        balloonResources count = ${Object.keys(this.balloonResources).length}
        cameraSetting count = ${Object.keys(this.balloonResources).length}
        outsidePosList count = ${Object.keys(this.outsidePosList).length}
        itemgrids count = ${Object.keys(this.itemgrids).length}
        dialogMains count = ${Object.keys(this.dialogMains).length}
        dialogTexts count = ${Object.keys(this.dialogTexts).length}
        dialogResults count = ${Object.keys(this.dialogResults).length}
        \n`;
        
        console.log(desc);
    }
    
    findRegisteItem(id: string): Nullable<ItemMetaData> {
        return this.registeItems[id];
    }

    findUnregisteItem(id: string): Nullable<ItemMetaData> {
        return this.unregisteItems[id];
    }

    public getItemData(isRegiste:boolean, itemId:string, itemStructName:string):Nullable<any>
    {
        if (isRegiste)
        {
            switch (itemStructName)
            {
                case "ItemData":        return this.findItem(itemId);
                case "BalloonResource": return this.findBalloonResource(itemId);
            }
    
            console.error(`TableDataManager::getItemData() not implemented item type. itemId = '${itemId}', metaDataType = '${itemStructName}'`);
            return null;
        }
        
        return this.noUseItems[itemId];
    }

    private async _loadJsonFromFile<T>(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<{ [key: string]: T; }>
    {
        try
        {
            const fileContent = await fs.promises.readFile(filePath, encoding);
            return this._loadItemsFromJson<T>(JSON.parse(fileContent));
        }
        catch (error)
        {
            console.error(`_loadJsonFromFile() Error loading items from file: ${error}`);
            throw error;
        }
    }

    private async _loadArrayFromFile<T>(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<T[]> {
        try {
            const fileContent = await fs.promises.readFile(filePath, encoding);
            return this._loadItemArrayFronJson<T>(JSON.parse(fileContent));
        }
        catch (error) {
            console.error(`_loadArrayFromCDN() Error loading items from file: ${error}`);
            throw error;
        }
    }
}