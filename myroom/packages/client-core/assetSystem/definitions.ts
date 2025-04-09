/**
 * Asset은 여러가지 관점을 가지고 있다. 약간의 용어 정의 한다.
 *
 * AssetPackage : Asset을 구성하는 여러 파일의 모임
 * AssetPackageLocalCache : s3와 같은 remote storage에 존재하는 파일을 빠른 로딩을 위해 로칼 파일로 저장하는 방식
 * AssetPackageFileSystem : Web 브라우저 위해서는 LocalCache를 위한 동작방식이 제한적이며, 브라우저 마다 상황이 다르다. 실행환경과 관계없이 동작하기 위한 Interface
 * AssetPackageFileLoader : 에셋 패키지의 특정 파일을 로드한다
 *
 * AssetLoader : 실제적으로 Asset을 Instance화 한다.
 */

import { ISceneLoaderAsyncResult, Nullable, Node } from "@babylonjs/core";
import { IAssetPackageInfo } from "./jsonTypes/assetPackageInfo";
import { ItemData, ItemCategory1, ItemCategory2, ItemCategory3 } from "../tableData/defines/System_Interface";

//---------------------------------------------------------------------------------------
// enum 정의부
//---------------------------------------------------------------------------------------
export enum eAssetType {
    None,
    Land,
    MyRoom,
    Avatar,
    Item,
    Model_glb,
    Enviroment,
    Material,
}

export enum eRoomObjectType {
    Item,
    Figure,
}

export enum ePlacementRotationType {
    Rot_0,
    Rot_90,
    Rot_180,
    Rot_270,
    //figure 45 회전 추가 기존의 배치정보와 충돌로 뒤에 선언한다
    Rot_45,
    Rot_135,
    Rot_225,
    Rot_315,
}

export enum eGridNormal {
    //벽을 Left Right를 구분 할수 없다. mesh 제작시 제약을 둬야한다.
    Y, //floor
    X, //left wall
    Z, //right wall
}

export enum EMediaType {
    Image,
    Video,
}

//---------------------------------------------------------------------------------------
// AssetPackage 관련
//---------------------------------------------------------------------------------------
export interface IAssetPacakgeInfoQuery {
    getAssetInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null>;
}

export interface IAssetPackageLocalCache {
    isCachedAsset(assetType: eAssetType, assetId: string, version: number): Promise<boolean>;
    storeAssetToCache(assetType: eAssetType, assetId: string, version: number): Promise<void>;
    removeAssetFromCache(assetType: eAssetType, assetId: string): Promise<void>;
    readAssetFromCache(assetType: eAssetType, assetId: string, version: number, filename: string): Promise<Blob | null>;
    clearAllCache(): Promise<void>;
}


export interface IAssetPackageFileSystem {
    isAssetDirExists(assetType: eAssetType, assetId: string, version: number): Promise<boolean>;
    createAssetDir(assetType: eAssetType, assetId: string, version: number): Promise<boolean>;
    deleteAssetDir(assetType: eAssetType, assetId: string): Promise<boolean>;
    createAssetFile(assetType: eAssetType, assetId: string, version: number, fileName: string, blob: Blob): Promise<boolean>;
    readAssetFile(assetType: eAssetType, assetId: string, version: number, fileName: string): Promise<Blob | null>;
    clear(): Promise<void>;
}


export interface IAssetPackageFileLoader {
    loadFile(assetType: eAssetType, assetId: string, filename: string): Promise<string>; //return => objectUrl , URL.createObjectURL 참조 할것
    getPackageInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null>;
    clearCache(): Promise<void>;
}

//---------------------------------------------------------------------------------------
// AssetLoader 관련
//---------------------------------------------------------------------------------------
export interface IAssetLoadingResult {
    errors: string[];
    loadedObjects: ISceneLoaderAsyncResult;
}

export interface IAssetLoader {
    loadAssetIntoScene(assetType: eAssetType, assetId: string, parent?: Nullable<Node>): Promise<IAssetLoadingResult>;
    loadAvatarAsset(assetId: string, avatarAssetLoadResultHandler: (result: Nullable<ISceneLoaderAsyncResult>) => void): Promise<void>;
    loadManifest<T>(assetType: eAssetType, assetId: string, filename: string | undefined): Promise<T | null>;
    getPackageInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null | undefined>;
    clearCache(): Promise<void>;
    isIgnoreModelMaterialChange(): boolean;
}

export interface ITableDataManager {
    loadTableDatas(): Promise<void>;
    findItem(id: string): Nullable<ItemData>;
    findCategory1(id: string): Nullable<ItemCategory1>;
    findCategory2(id: string): Nullable<ItemCategory2>;
    findCategory3(id: string): Nullable<ItemCategory3>;
}

export interface ISetFaceMorphData {
    name: string;
    value: number;
}