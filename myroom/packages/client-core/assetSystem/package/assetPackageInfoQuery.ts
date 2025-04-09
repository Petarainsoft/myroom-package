
import axios from 'axios';

import { Constants } from "../constants";
import { IAssetPackageInfo } from "../jsonTypes/assetPackageInfo";
import { IAssetPacakgeInfoQuery, eAssetType } from "../definitions";
import * as _ from "lodash";
import { AssetUtils } from "../assetUtils";
import { BuildConfig } from '../../common/buildConfig';

export class AssetPackageInfoQuery implements IAssetPacakgeInfoQuery {

    private _allAssetInfos: Array<Map<string, IAssetPackageInfo | null>> = [];

    /**
     * 생성자
     */
    public constructor() {
        Object.keys(eAssetType).forEach(() => {
            this._allAssetInfos.push(new Map<string, IAssetPackageInfo | null>());
        });
    }


    /**
     * 에셋의 버젼을 구해온다
     * @param assetType
     * @param assetId
     * @returns
     */
    public async getAssetInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null> {
        const versionMap = this._getVersionMap(assetType);
        if (versionMap.has(assetId)) {
            return versionMap.get(assetId)!;
        }

        if (!assetId) {
            console.error(`getAssetInfo() assetType = '${assetType}', assetId = '${assetId}'`);
            return null;
        }

        let resData = await AssetPackageInfoQuery.RequestAssetInfo(assetId);
        if (resData === -1) {
            console.error(`AssetPackageInfoQuery.getAssetInfo(): Failed RequestAssetInfo(),  assetType = '${assetType}', assetId = '${assetId}'`);
            return null;
        }

        let version = resData.option.version as number;
        const manifestUrl = resData.resource.manifest;

        if (version < 0) {
            console.error(`getAssetInfo() Invliad item version. force use version 1. assetType = '${assetType}', assetId = '${assetId}'`);
            version = 1;
        }
        //console.log(`getAssetInfo() version = '${version}'`);

        let baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/'));
        const packageUrl = `${baseUrl}/${Constants.ASSET_PACKAGE_INFO_FILENAME}`;

        //console.log(`AssetPackageInfoQuery::getAssetInfo() packageUrl = ${packageUrl}`);
        const info = await AssetUtils.readJsonFromUrl<IAssetPackageInfo>(packageUrl);
        if (info) {
            info.version = version;
            info.baseUrl = baseUrl;
            info.packageUrl = packageUrl;
            info.manifestUrl = manifestUrl;

            versionMap.set(assetId, info);
        }
        else {
            //반복 요청하지 않도록 여기서 null을 넣어준다
            console.error(`AssetVersionQuery.getAssetInfo() : failed!!, url = '${packageUrl}'`);
            versionMap.set(assetId, null);
        }

        return versionMap.get(assetId)!;
    }


    /**
     * _allAssetVersions에서 에셋 타입에 맞게 container를 받아온다
     * @param assetType
     * @returns
     */
    private _getVersionMap(assetType: eAssetType): Map<string, IAssetPackageInfo | null> {
        return this._allAssetInfos[assetType];
    }

    public static async RequestAssetInfo(itemId: string): Promise<any> {
        if (BuildConfig.isDevTool) {
            const assetInfoFromLocalServer = await AssetPackageInfoQuery._getAssetInfoFromLocalServer(itemId);
            if (assetInfoFromLocalServer !== -1) {
                return assetInfoFromLocalServer;
            }
        }

        const url = `${Constants.BASEURL_API}/meta/items/${itemId}`;

        try {
            const headers = AssetUtils.makeHeader(true, "", true, "");
            const response = await axios.get(url, { headers: headers });

            const resData = response.data;
            //console.log('assetPackageInfoQuery::_requestAssetVersion() : ', resData);

            //return resData.data.option.version;
            return resData.data;
        }
        catch (error: any) {
            AssetUtils.printError(`assetPackageInfoQuery::RequestAssetInfo() url='${url}'`, error, "");
        }

        return -1;
    }

    // public async test() {
    //     // const landId = "5eyeKtSccTJanf2qrX3Xk"
    //     // const landVersion = await this.getLandVersion(landId)
    //     // console.log(`land ${landId} - version ${landVersion}`)

    //     // const avatarId = "wUlLsgehLeFCJ9c6oftjc"
    //     // const avartaVersion = await this.getAvatarVersion(avatarId)
    //     // console.log(`avatar ${avatarId} - version ${avartaVersion}`)

    //     // const assetId = "1Sa5ZfVB9CCu1KGWpdScHQ"
    //     // const assetVersion = await this.getItemVersion(assetId)
    //     // console.log(`asset ${assetId} - version ${assetVersion}`)

    //     const itemId = "1Sa5ZfVB9CCu1KGWpdScHQ"
    //     const itemVersion = await this.getAssetVersion(eAssetType.Item, itemId)
    //     console.log(`item ${itemId} - version ${itemVersion}`)
    // }

    //-----------------------------------------------------------------------------------
    // Local Asset Server 관련
    //-----------------------------------------------------------------------------------
    private static _isFirstCheckAssetServer = true;
    private static _isUsingLocalAssetServer = false;
    private static async _checkUsingLocalAssetServer(): Promise<boolean> {
        if (this._isFirstCheckAssetServer) {
            this._isFirstCheckAssetServer = false;
            try {
                //포트번호 9567 ==> ArtStudio / assetServer 참조
                //const headers = AssetUtils.makeHeader(true, "", true, "");
                //const response = await axios.get(`http://localhost:9567/status`, { headers: headers });
                const response = await fetch(`http://localhost:9567/status`);
                if (response.ok) {
                    const status = await response.json();
                    this._isUsingLocalAssetServer = status.status === "ok";
                }
                else {
                    this._isUsingLocalAssetServer = false;
                }
            }
            catch (error: any) {
                this._isUsingLocalAssetServer = false;
            }
        }

        return this._isUsingLocalAssetServer;
    }

    private static async _getAssetInfoFromLocalServer(itemId: string): Promise<any> {
        if (await AssetPackageInfoQuery._checkUsingLocalAssetServer()) {
            try {
                const response = await fetch(`http://localhost:9567/items/${itemId}`);
                if (response.ok) {
                    const info = await response.json();
                    return info;
                }
            }
            catch (error: any) {
                //에러 처리 않한다..
            }
        }

        return -1;

    }

}