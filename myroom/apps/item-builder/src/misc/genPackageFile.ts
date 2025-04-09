import { MakeAssetPackageInfo } from '../genManifest/makeAssetPackageInfo.js';
import { ItemBuilderUtil } from './itemBuilderUtil.js';
import { ItemBuilderPath } from './itemBuilderPath.js';
import { ItemCategory3, ItemData } from '../../../../packages/client-core/tableData/defines/System_Interface.js';

export class GenPackageFile
{
    public static async Generate(item:ItemData, category3:ItemCategory3)
    {
        const itemDstRoot = ItemBuilderPath.getTempItemRoot(item, category3);
        const list = new MakeAssetPackageInfo();
        
        list.version = 1;
        list.files = await ItemBuilderUtil.getFileList(itemDstRoot);

        const manifestDstPath = ItemBuilderPath.getTempItemPackagePath(item, category3);
        await ItemBuilderUtil.writeFile(manifestDstPath, JSON.stringify(list));
    }
}