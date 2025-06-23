import { Constants } from "client-core/assetSystem/constants";
import { ItemBuildProcessor } from "./buildProcess/itemBuildProcessor";

export class DiffItem
{
    public static async run()
    {
        const buildProcessor = new ItemBuildProcessor();
        await buildProcessor.process_DiffrentData();
        buildProcessor.hasErrorThen(false);

        console.log(`DiffItem::run() DEV_ENV = '${Constants.DEV_ENV}'`);
        console.log(`DiffItem::run() BASEURL_API = '${Constants.BASEURL_API}'`);
    }
}

await DiffItem.run();