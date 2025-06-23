import { ItemCategory3, ItemData } from "client-core/tableData/defines/System_Interface";
import { MakeAssetManifest_None } from './makeAssetManifest_None';
import { ItemBuilderUtil } from '../misc/itemBuilderUtil';
import { eAssetType } from 'client-core/assetSystem/definitions';
import { ItemBuilderPath } from '../misc/itemBuilderPath';

export class GenManifestFile_None
{
    public static async Generate(itemDstRoot:string, item:ItemData, category3:ItemCategory3)
    {
        const manifestDstPath = ItemBuilderPath.getTempItemManifestPath(item, category3);
        const manifest = new MakeAssetManifest_None();
        
        // Balloon 아이템 같은 경우
        // 썸네일 이미지만 있고, 실제로 로드할 파일이 없기에 manifest파일이 필요하지 않음.
        // 하지만 서버에서는 최소한의 manifest.json라도 있어야 한다고 하여
        // None 타입의 manifest.json을 생성한다.

        manifest.format = 3;
        manifest.main.type = eAssetType[eAssetType.None] as string;
        
        await ItemBuilderUtil.writeFile(manifestDstPath, JSON.stringify(manifest));
    }
}