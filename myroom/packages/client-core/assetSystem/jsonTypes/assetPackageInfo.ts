export interface IAssetPackageInfo {
    // 아이템 빌드 시 결정됨
    files: string[];

    // 이하 런타임에 세팅됨
    version: number;
    baseUrl:string;         // https://resource.develop.colorver.se/meta/item/2rawe4rfawetrfa34rt/1/
    manifestUrl:string;     // https://resource.develop.colorver.se/meta/item/2rawe4rfawetrfa34rt/1/manifest.json
    packageUrl:string;      // // https://resource.develop.colorver.se/meta/item/2rawe4rfawetrfa34rt/1/package.json
}