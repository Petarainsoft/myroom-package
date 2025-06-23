import { Constants } from "../constants";
import { ENABLE_LOCALCACHE } from "../../common/constants";
import * as BABYLON from "@babylonjs/core";

import { IAssetPackageLocalCache, IAssetPacakgeInfoQuery, IAssetPackageFileLoader, eAssetType } from "../definitions";
import { ILoadedAsset } from "../jsonTypes/loadedAsset";
import { AssetUtils } from "../assetUtils";
import { AssetPackageLocalCache } from "./assetPackageLocalCache";
import { AssetPackageInfoQuery } from "./assetPackageInfoQuery";
import { AssetPackageFileSystem_OPFS } from "./assetPackageFileSystem_OPFS";
import { AssetPackageFileSystem_IDB } from "./assetPackageFileSystem_IDB";
import { IAssetPackageInfo } from "../jsonTypes/assetPackageInfo";



export class WaitList {
    private _waitList: Array<() => void> = [];

    public wait(): Promise<void> {
        return new Promise((resolve) => {
            this._waitList.push(resolve);
        });
    }

    public notifyAll(): void {
        this._waitList.forEach((v) => {
            v();
        });
        this._waitList = [];
    }
}

export class AssetPackageFileLoader implements IAssetPackageFileLoader {
    private static _instance: AssetPackageFileLoader | null = null; //singleton

    private _assetInfoQuery!: IAssetPacakgeInfoQuery;
    private _localCache: IAssetPackageLocalCache | null = null;
    private _loadedAssets: Map<string, ILoadedAsset> = new Map<string, ILoadedAsset>();
    private _loadingAssets: Map<string, WaitList> = new Map<string, WaitList>();
    private _checkTimer: any = null;

    public constructor() {
        AssetPackageFileLoader._instance = this;

        this._assetInfoQuery = new AssetPackageInfoQuery();
        // 기본적으로 localCache 사용하지 않음. 사용하도록 설정 시 userAgent 에 따라 OPFS 혹은 IndexedDB 사용
        if (ENABLE_LOCALCACHE) {
            //console.log('USE ENABLE_LOCALCACHE')
            this._localCache = new AssetPackageLocalCache(this._assetInfoQuery, new AssetPackageFileSystem_IDB());
            const assetFileSystem = this._getAssetFileSystemByUserAgent();
            this._localCache = new AssetPackageLocalCache(this._assetInfoQuery, assetFileSystem);
        }
        // scene에 종속되지 않고, singleton으로 구동될 수 있도록 수정.
        this._checkTimer = setInterval(() => this._removeLifetimeOverAssets(), 1000);
    }

    public finalize() {
        if (this._checkTimer) {
            clearInterval(this._checkTimer);
            this._checkTimer = null;
        }
    }

    public static getInstance(): AssetPackageFileLoader {
        if (null == AssetPackageFileLoader._instance) {
            return new AssetPackageFileLoader();
        }
        return AssetPackageFileLoader._instance;
    }

    public async loadFile(assetType: eAssetType, assetId: string, filename: string): Promise<string> {
        const loadedAssetKey = this._makeLoaddedAssetKey(assetType, assetId, filename);
        if (this._loadingAssets.has(loadedAssetKey)) {
            const waitList = this._loadingAssets.get(loadedAssetKey);
            if (waitList) {
                //console.error("loadFile-wait", assetType, assetId, filename);
                await waitList.wait();
            }
        }

        if (this._loadedAssets.has(loadedAssetKey)) {
            const loadedAsset = this._loadedAssets.get(loadedAssetKey);
            return loadedAsset!.objectUrl;
        }

        const waitList = new WaitList();
        this._loadingAssets.set(loadedAssetKey, waitList);

        //console.error("loadFile-load", assetType, assetId, filename);

        let resultString = "";
        const assetInfo = await this._assetInfoQuery.getAssetInfo(assetType, assetId);
        if (assetInfo != null) {
            if (this._localCache) {
                resultString = await this._loadAsset_UsingAssetCache(assetType, assetId, assetInfo.version, filename);
            } else {
                resultString = await this._loadAsset_FromUrl(assetType, assetId, assetInfo.baseUrl, filename);
            }
            waitList.notifyAll();
            this._loadingAssets.delete(loadedAssetKey);
        } else {
            console.error(`AssetPackageFileLoader.loadFile() : failed!! assetType=${eAssetType[assetType]} assetId=${assetId} filename=${filename}`);
        }
        return resultString;
    }

    public async getPackageInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null> {
        return await this._assetInfoQuery.getAssetInfo(assetType, assetId);
    }

    public async clearCache(): Promise<void> {
        if (this._localCache) {
            await this._localCache.clearAllCache();
        }
    }

    private _removeLifetimeOverAssets(): void {
        const curTime: number = new Date().getTime();

        const willRemoveItems: string[] = [];
        this._loadedAssets.forEach((v, k) => {
            if ((curTime - v.lastAssetTime) > Constants.LOADED_ASSET_LIFETIME) {
                willRemoveItems.push(k);
            }
        });

        willRemoveItems.forEach(k => {
            const objUrl = this._loadedAssets.get(k)?.objectUrl;
            if (objUrl) {
                //console.log(`AssetPackageFileLoader._removeLifetimeOverAssets() => remove obj ${objUrl}`)
                URL.revokeObjectURL(objUrl);
            }
            this._loadedAssets.delete(k);
        });
    }

    private async _loadAsset_UsingAssetCache(assetType: eAssetType, assetId: string, version: number, filename: string): Promise<string> {
        console.log('assetPackageFileLoader _loadAsset_UsingAssetCache');
        if (this._localCache) {
            const isCached = await this._localCache.isCachedAsset(assetType, assetId, version);
            if (!isCached) {
                await this._localCache.storeAssetToCache(assetType, assetId, version);
            }
            const data = await this._localCache.readAssetFromCache(assetType, assetId, version, filename);
            if (null != data && data instanceof Blob) {
                const objUrl = URL.createObjectURL(data);
                this._addLoadedAsset(assetType, assetId, filename, objUrl);
                return objUrl;
            }
        }

        console.error(`AssetLoader._loadAsset_UsingAssetCache() : failed!! assetType=${eAssetType[assetType]} assetId=${assetId} filename=${filename}`);
        return "";
    }

    private async _loadAsset_FromUrl(assetType: eAssetType, assetId: string, baseUrl: string, filename: string): Promise<string> {
        //console.log('assetPackageFileLoader _loadAsset_FromUrl');
        const fileUrl = `${baseUrl}/${filename}`;
        const response = await fetch(fileUrl);
        if (response.ok) {
            const data = await response.blob();
            const objUrl = URL.createObjectURL(data);
            this._addLoadedAsset(assetType, assetId, filename, objUrl);
            return objUrl;
        }

        console.error(`AssetLoader._loadAsset_FromUrl() : failed!! assetType=${eAssetType[assetType]} assetId=${assetId} filename=${filename}`);
        return "";
    }


    private _makeLoaddedAssetKey(assetType: eAssetType, assetId: string, filename: string): string {
        return `${assetType}.${assetId}.${filename}`;
    }

    private _addLoadedAsset(assetType: eAssetType, assetId: string, filename: string, objUrl: string): void {
        const key = this._makeLoaddedAssetKey(assetType, assetId, filename);
        //console.log('assetPackageFileLoader _addLoadedAsset ', key, assetType, assetId, filename, objUrl)
        this._loadedAssets.set(key, {
            assetType: assetType,
            assetId: assetId,
            assetFile: filename,
            objectUrl: objUrl,
            lastAssetTime: new Date().getTime()
        });
    }

    private _getAssetFileSystemByUserAgent() {

        const UA = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipod|ipad|macintosh/.test(UA)) {
            if (/safari/.test(UA)) {
                //console.log('_checkUserAgent ios safari: ');
                return new AssetPackageFileSystem_IDB();
            } else {
                //console.log('_checkUserAgent: ios not safari');
                // ios 웹뷰 추가테스트 필요
                return new AssetPackageFileSystem_IDB();
            }
        } else {
            /**
             * chrome, edge : OPFS 정상
             * edge, samsungbroswser: IDB 필요
            */
            if (/firefox|samsung/.test(UA)) {
                return new AssetPackageFileSystem_IDB();
            } else {
                return new AssetPackageFileSystem_OPFS();
            }

            // 안드로이드 웹뷰의 경우 추가테스트 필요
        }
    }

}