import { Nullable } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";

import { eAssetType } from "../../definitions";
import { IAssetManifest } from "../../jsonTypes/manifest/assetManifest";

export enum eAssetUnit {
    Model_glb = "Model_glb",
    Particle = "Particle"
}

export interface IAssetUnitLoader {
    loadAssetUnit(manifest: IAssetManifest, assetInfo: { assetType: eAssetType, assetId: string; }, parent?: Nullable<BABYLON.Node>, essentialLoaded?: (result: Nullable<BABYLON.ISceneLoaderAsyncResult>) => void): Promise<Nullable<BABYLON.ISceneLoaderAsyncResult>>;
    clearCache(): void;
}