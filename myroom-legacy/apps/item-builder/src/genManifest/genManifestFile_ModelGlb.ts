import { ItemCategory3, ItemData } from "../../../../packages/client-core/tableData/defines/System_Interface";
import { MakeAssetManifest_ModelGlb } from './makeAssetManifest_ModelGlb';
import { ItemBuilderUtil } from '../misc/itemBuilderUtil';
import { eAssetType } from '../../../../packages/client-core/assetSystem/definitions';
import { ItemBuilderPath } from '../misc/itemBuilderPath';

export class GenManifestFile_ModelGlb
{
    public static async Generate(itemDstRoot:string, item:ItemData, category3:ItemCategory3)
    {
        const manifestDstPath = ItemBuilderPath.getTempItemManifestPath(item, category3);
        const manifest = new MakeAssetManifest_ModelGlb();
        
        manifest.format = 3;
        manifest.main.type = eAssetType[eAssetType.Model_glb] as string;
        manifest.main.modelfile = `${item.client_itemid}.glb`;
        
        await ItemBuilderUtil.writeFile(manifestDstPath, JSON.stringify(manifest));
    }
}