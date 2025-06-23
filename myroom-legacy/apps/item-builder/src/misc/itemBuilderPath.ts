import path from 'path';
import { ItemCategory3, ItemData } from '../../../../packages/client-core/tableData/defines/System_Interface';
import { ItemBuilderParams } from './itemBuilderParams';
import { ItemBuilderUtil } from './itemBuilderUtil';
import { Constants } from '../../../../packages/client-core/assetSystem/constants';
import { TableDataManager } from 'client-core/tableData/tableDataManager';

export class ItemBuilderPath
{
    public static getItemBuildTempRoot(): string
    {
        return path.join(ItemBuilderParams.getBuildRoot(), "temp");
    }

    public static getItemBuildZipRoot(): string
    {
        return path.join(ItemBuilderParams.getBuildRoot(), "zips");
    }

    public static getItemZipFilename(item:ItemData):string
    {
        return `${item.client_itemid}.zip`;
    }

    public static getSvnItemPath(item:ItemData, category3:ItemCategory3): string
    {
        const itemDirName = ItemBuilderUtil.getFolderName(item, category3);
        return path.join(ItemBuilderParams.getSvnRoot(), itemDirName);
    }

    public static getThumbnailPath(item:ItemData, category3:ItemCategory3): string
    {
        const itemDirName = ItemBuilderUtil.getFolderName(item, category3);
        return path.join(ItemBuilderParams.getSvnRoot(), itemDirName, Constants.THUMBNAIL_FILENAME);
    }

    public static getTempItemRoot(item:ItemData, category3:ItemCategory3): string
    {
        const itemDirName = ItemBuilderUtil.getFolderName(item, category3);
        return path.join(ItemBuilderPath.getItemBuildTempRoot(), itemDirName, item.ID);
    }

    public static getTempItemManifestPath(item:ItemData, category3:ItemCategory3):string
    {
        const itemDstRoot = ItemBuilderPath.getTempItemRoot(item, category3);
        return path.join(itemDstRoot, Constants.MANIFEST_FILENAME);
    }

    public static getTempItemPackagePath(item:ItemData, category3:ItemCategory3):string
    {
        const itemDstRoot = ItemBuilderPath.getTempItemRoot(item, category3);
        return path.join(itemDstRoot, Constants.ASSET_PACKAGE_INFO_FILENAME);
    }

    public static getZipDstPath(item:ItemData, category3:ItemCategory3):string
    {
        const itemDirName = ItemBuilderUtil.getFolderName(item, category3);
        return path.join(ItemBuilderPath.getItemBuildZipRoot(), itemDirName, item.ID, ItemBuilderPath.getItemZipFilename(item));
    }
}