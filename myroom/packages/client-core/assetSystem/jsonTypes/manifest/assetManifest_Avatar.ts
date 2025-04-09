import { IAssetManifest } from "./assetManifest";

export interface IAssetManifest_Avatar extends IAssetManifest {
    format: number;
    main:
    {
        type: string,

        skeleton: string,
        equipments: string[],
        animation?: string;
        customizations?: {
            skinColor?: string;
            hairColor?: string;
            makeupTexture?: string;
        };
    };
}