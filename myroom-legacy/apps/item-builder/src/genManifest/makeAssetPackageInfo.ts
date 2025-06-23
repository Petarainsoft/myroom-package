import { IAssetPackageInfo } from "../../../../packages/client-core/assetSystem/jsonTypes/assetPackageInfo";

export class MakeAssetPackageInfo implements IAssetPackageInfo
{
    files: string[] = [];

    version: number = 1;
    baseUrl:string = "";
    manifestUrl:string = "";
    packageUrl:string = "";
}