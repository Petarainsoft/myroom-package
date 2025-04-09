
import { CacheDataController } from "../buildCache/cacheDataController";
import { CacheData_Current, ERegisteResult } from "../buildCache/defineBuildCache";
import { ItemBuildResultPrinter } from "./itemBuildResultPrinter";

export class ChangedItemDataPrinter
{
    private static controller: CacheDataController;


    private static readonly showAddedItemLog:boolean        = true;
    private static readonly showUpdateItemLog:boolean       = true;
    private static readonly showinvalidItemLog:boolean      = true;
    private static readonly showUploadResourceLog:boolean   = true;
    private static readonly showDeleteItemLog:boolean       = true;

    private static readonly showValidFailureLog:boolean     = true;
    private static readonly showDeleteFailureLog:boolean    = true;

    public static async print(controller:CacheDataController): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));

        this.controller = controller;

        const validAddedItemList = Object.values(controller.currentValidDatas)
            .filter(item => item.isNeedRegisteItem)
            .map(item => item);

        const validUpdateItemList = Object.values(controller.currentValidDatas)
            .filter(item => item.isNeedUpdateItem)
            .map(item => item);

        const validinvalidItemList = Object.values(controller.currentValidDatas)
            .filter(item => item.registeResult > ERegisteResult.AlreadyRegisted)
            .map(item => item);

        const validUploadResourceList = Object.values(controller.currentValidDatas)
            .filter(item => item.isNeedUploadResource)
            .map(item => item);

        const vliadFailureList = Object.values(controller.currentValidDatas)
            .filter(item => item.registeResult > ERegisteResult.AlreadyRegisted)
            .map(item => item);



        const deleteItemList = Object.values(controller.currentDeletedDatas)
            .filter(item => item.isNeedDeleteItem)
            .map(item => item);

        const deleteFailureList = Object.values(controller.currentDeletedDatas)
            .filter(item => item.registeResult > ERegisteResult.AlreadyRegisted)
            .map(item => item);

        

        const validAddedItemCount       = Object.keys(validAddedItemList).length;
        const validUpdateItemCount      = Object.keys(validUpdateItemList).length;
        const validinvalidItemCount     = Object.keys(validinvalidItemList).length;
        const validUploadResourceCount  = Object.keys(validUploadResourceList).length;
        const valiadFailureCount        = Object.keys(vliadFailureList).length;

        const deleteItemCount           = Object.keys(deleteItemList).length;
        const deleteFailureCount        = Object.keys(deleteFailureList).length;

        if (this.showAddedItemLog && validAddedItemCount > 0)
        {
            this._print_added_items(validAddedItemList);
        }

        if (this.showUpdateItemLog && validUpdateItemCount)
        {
            this._print_update_items(validUpdateItemList)
        }

        if (this.showinvalidItemLog && validinvalidItemCount)
        {
            this._print_invalid_items(validinvalidItemList)
        }
        
        if (this.showUploadResourceLog && validUploadResourceCount)
        {
            this._print_upload_resources(validUploadResourceList)
        }

        if (this.showValidFailureLog && valiadFailureCount)
        {
            this._print_valid_failure_items(vliadFailureList)
        }


        if (this.showDeleteItemLog && deleteItemCount)
        {
            this._print_delete_items(deleteItemList)
        }

        if (this.showDeleteFailureLog && deleteFailureCount)
        {
            this._print_delete_failure_items(deleteFailureList)
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[changed data count] =====================================
        valid Added item count      = ${validAddedItemCount}
        valid Update item count     = ${validUpdateItemCount}
        valid Invalid item count    = ${validinvalidItemCount}
        valid Upload resource count = ${validUploadResourceCount}
        valid Failure count         = ${valiadFailureCount}

        delete item count           = ${deleteItemCount}
        delete Failure count        = ${deleteFailureCount}`);


        if (valiadFailureCount > 0 || deleteFailureCount > 0)
        {
            await ItemBuildResultPrinter._print_error_detail(vliadFailureList, deleteFailureList);
            await new Promise(resolve => setTimeout(resolve, 500));
            await ItemBuildResultPrinter._print_error_summary(vliadFailureList, deleteFailureList);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    private static _print_added_items(list:CacheData_Current[])
    {
        console.log(`[print_added_items] ==============================================`);
        for (const key in list)
        {
            console.log(`[added item] item_id='${list[key].ID}']`);
            console.log(`\t${JSON.stringify(list[key].metadata)}`);
        }
    }

    private static _print_update_items(list:CacheData_Current[])
    {
        console.log(`[print_update_items] ==============================================`);
        for (const key in list)
        {
            const currentdata = list[key];
            const historyData = this.controller.getHistoryValidData(currentdata.ID);

            const changedMemberList = this.findDifferentMembers(historyData!.metadata, currentdata.metadata);
            console.log(`[changed item] item_id='${currentdata.ID}']`);
            for (const m in changedMemberList)
            {
                console.log(`\t${changedMemberList[m]}`);
            }
        }
    }

    private static _print_invalid_items(list:CacheData_Current[])
    {
        console.log(`[print_invalid_items] ==============================================`);
        for (const key in list)
        {
            const currentdata = list[key];

            const registeResult = ERegisteResult[currentdata.registeResult];
            console.log(`[invalid item] item_id='${currentdata.ID}'], registeResult='${registeResult}', errorString='${currentdata.errorString}'`);
        }
    }

    private static _print_upload_resources(list:CacheData_Current[])
    {
        console.log(`[print_upload_resources] ==============================================`);
        for (const key in list)
        {
            const currentData = list[key];
            const historyData = this.controller.getHistoryValidData(currentData.ID);

            if (!historyData)
            {
                console.log(`[first upload resources] item_id='${currentData.ID}', resource_id='${currentData.metadata.client_itemid}'`);
                for (const r in currentData.resource)
                {
                    console.log(`\t${JSON.stringify(currentData.resource[r])}`);
                }
            }
            else
            {
                const hResCount = Object.keys(historyData.resource).length;
                const cResCount = Object.keys(currentData.resource).length;

                if (hResCount !== cResCount)
                {
                    console.log(`[changed resources] item_id='${currentData.ID}', resource_id='${currentData.metadata.client_itemid}'`);
                    console.log(`\tchanged resource count : ${hResCount} => ${cResCount}`);
                }
                else if (hResCount > 0)
                {
                    console.log(`[changed resources] item_id='${currentData.ID}', resource_id='${currentData.metadata.client_itemid}'`);

                    for (let i: number = 0; i < hResCount; i++)
                    {
                        if (JSON.stringify(historyData.resource[i].checksum) !== JSON.stringify(currentData.resource[i].checksum))
                        {
                            const msg = `  ${historyData.resource[i].fileName}(${currentData.resource[i].fileName})` +
                            `\n    before = '${historyData.resource[i].checksum}'` +
                            `\n    after  = '${currentData.resource[i].checksum}'`;
                            
                            console.log(`${msg}`);
                        }
                    }
                }
            }
        }
    }

    private static _print_delete_items(list:CacheData_Current[])
    {
        console.log(`[print_delete_items] ==============================================`);
        for (const key in list)
        {
            const currentdata = list[key];
            console.log(`[delete item] item_id='${currentdata.ID}']`);
        }
    }

    private static _print_valid_failure_items(list:CacheData_Current[])
    {
        console.log(`[_print_valid_failure_items] ==============================================`);
        for (const key in list)
        {
            const currentdata = list[key];
            console.log(`[valid failure item] item_id='${currentdata.ID}']`);
        }
    }

    private static _print_delete_failure_items(list:CacheData_Current[])
    {
        console.log(`[_print_delete_failure_items] ==============================================`);
        for (const key in list)
        {
            const currentdata = list[key];
            console.log(`[delete failure item] item_id='${currentdata.ID}']`);
        }
    }

    private static findDifferentMembers(history:any, current:any): string[]
    {
        const differentMembers: string[] = [];

        console.log(`hostory => ${JSON.stringify(history)}\ncurrent => ${JSON.stringify(current)}`);

        const hMembers = Object.keys(history);
        for (const member of hMembers)
        {
            if (!history[member])
            {
                // 여기 들어올 일은 없겠구나
            }
            else if (current[member] === undefined)
            {
                const msg = `${member} : deleted member`;
                differentMembers.push(msg);
            }
            else if (JSON.stringify(history[member]) !== JSON.stringify(current[member]))
            {
                const msg = `${member} : '${history[member]}' => '${current[member]}'`;
                differentMembers.push(msg);
            }
        }

        const cMembers = Object.keys(current);
        for (const member of cMembers)
        {
            if (history[member] === undefined)
            {
                const msg = `${member} : added member`;
                differentMembers.push(msg);
            }
        }

        return differentMembers;
    }
}