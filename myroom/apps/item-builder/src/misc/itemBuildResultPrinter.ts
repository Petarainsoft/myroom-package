import { CacheDataController } from "../buildCache/cacheDataController";
import { ERegisteResult } from "../buildCache/defineBuildCache";
import { CacheData_Current } from "../buildCache/defineBuildCache";


export class ItemBuildResultPrinter
{
    public static async print(controller:CacheDataController): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1));
        
        const vliadSuccessList = Object.values(controller.currentValidDatas)
            .filter(item => item.registeResult === ERegisteResult.SucceededRegiste)
            .map(item => item);

        const vliadAlreadyList = Object.values(controller.currentValidDatas)
            .filter(item => item.registeResult === ERegisteResult.AlreadyRegisted)
            .map(item => item);

        const vliadFailureList = Object.values(controller.currentValidDatas)
            .filter(item => item.registeResult !== ERegisteResult.SucceededRegiste &&
                            item.registeResult !== ERegisteResult.AlreadyRegisted)
            .map(item => item);


        const deleteSuccessList = Object.values(controller.currentDeletedDatas)
            .filter(item => item.registeResult === ERegisteResult.SucceededRegiste)
            .map(item => item);

        const deleteAlreadyList = Object.values(controller.currentDeletedDatas)
            .filter(item => item.registeResult === ERegisteResult.AlreadyRegisted)
            .map(item => item);

        const deleteFailureList = Object.values(controller.currentDeletedDatas)
            .filter(item => item.registeResult !== ERegisteResult.SucceededRegiste &&
                            item.registeResult !== ERegisteResult.AlreadyRegisted)
            .map(item => item);

        const validTotalCount = Object.keys(controller.currentValidDatas).length;
        const validAlreadyCount = Object.keys(vliadAlreadyList).length;
        const valiadSuccessCount = Object.keys(vliadSuccessList).length;
        const valiadFailureCount = Object.keys(vliadFailureList).length;

        const deleteTotalCount = Object.keys(controller.currentDeletedDatas).length;
        const deleteAlreadyCount = Object.keys(deleteAlreadyList).length;
        const deleteSuccessCount = Object.keys(deleteSuccessList).length;
        const deleteFailureCount = Object.keys(deleteFailureList).length;

        await new Promise(resolve => setTimeout(resolve, 500));
        if (valiadFailureCount > 0 || deleteFailureCount > 0)
        {
            await this._print_error_detail(vliadFailureList, deleteFailureList);
            await new Promise(resolve => setTimeout(resolve, 500));
            await this._print_error_summary(vliadFailureList, deleteFailureList);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[build result count] =====================================
        total valid count   = ${validTotalCount}
        already count       = ${validAlreadyCount}
        success count       = ${valiadSuccessCount}
        failure count       = ${valiadFailureCount}

        total delete count  = ${deleteTotalCount}
        already count       = ${deleteAlreadyCount}
        success count       = ${deleteSuccessCount}
        failure count       = ${deleteFailureCount}`);
    }

    public static async _print_error_detail(validErrList:CacheData_Current[], deleteErrList:CacheData_Current[]): Promise<void>
    {
        console.log(`[print_error_detail] ==============================================`);
        for (const key in validErrList)
        {
            console.error(`[ERROR REGISTE] ${JSON.stringify(validErrList[key], null, 2)}`);
        }

        for (const key in deleteErrList)
        {
            console.error(`[ERROR DELETE] ${JSON.stringify(deleteErrList[key], null, 2)}`);
        }
    }

    public static async _print_error_summary(validErrList:CacheData_Current[], deleteErrList:CacheData_Current[]): Promise<void>
    {
        console.log(`[print_error_summary] ==============================================`);
        for (const key in validErrList)
        {
            const item = validErrList[key];
            const registeResult = ERegisteResult[item.registeResult];
            console.error(`[ERROR REGISTE] item_id='${item.ID}', registeResult='${registeResult}', errorString='${item.errorString}'`);
        }

        for (const key in deleteErrList)
        {
            const item = deleteErrList[key];
            const registeResult = ERegisteResult[item.registeResult];
            console.error(`[ERROR DELETE] item_id='${item.ID}', registeResult='${registeResult}', errorString='${item.errorString}'`);
        }
    }
}