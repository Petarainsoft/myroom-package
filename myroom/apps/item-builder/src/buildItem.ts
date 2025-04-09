import { Constants } from "client-core/assetSystem/constants";
import { ItemBuildProcessor } from "./buildProcess/itemBuildProcessor";

export class BuildItem
{
    public static async run()
    {
        const buildProcessor = new ItemBuildProcessor();
        await buildProcessor.process_DiffrentData();
        await buildProcessor.process_RegisteData();
        buildProcessor.hasErrorThen(true);

        console.log(`BuildItem::run() DEV_ENV = '${Constants.DEV_ENV}'`);
        console.log(`BuildItem::run() BASEURL_API = '${Constants.BASEURL_API}'`);
    }
}

await BuildItem.run();