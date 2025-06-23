import { Constants } from "client-core/assetSystem/constants";
import { ItemBuildProcessor } from "./buildProcess/itemBuildProcessor";

export class TestItem
{
    public static async run()
    {
        const buildProcessor = new ItemBuildProcessor();
        await buildProcessor.process_DiffrentData();
        buildProcessor.hasErrorThen(false);

        for (const key in buildProcessor.cacheDataController.currentValidDatas)
        {
            const currData = buildProcessor.cacheDataController.currentValidDatas[key];
            buildProcessor.cacheDataController.succeededRegiste(currData, true);
        }

        for (const key in buildProcessor.cacheDataController.currentDeletedDatas)
        {
            const currData = buildProcessor.cacheDataController.currentDeletedDatas[key];
            buildProcessor.cacheDataController.succeededRegiste(currData, false);
        }
        
        buildProcessor.cacheDataController.saveHistoryDatas();


        console.log(`TestItem::run() DEV_ENV = '${Constants.DEV_ENV}'`);
        console.log(`TestItem::run() BASEURL_API = '${Constants.BASEURL_API}'`);
    }
}

await TestItem.run();