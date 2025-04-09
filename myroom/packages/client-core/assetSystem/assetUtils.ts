import { eAssetType } from "./definitions";
import { Constants } from "./constants";

export class AssetUtils {
    private static _jsonCache = new Map<string, any>();
    public static clearJsonCache() {
        this._jsonCache.clear();
    }
    /**
     * Url로 부터 Json 파일을 읽는다. (Object Url 포함)
     * @param url
     * @returns
     */
    public static async readJsonFromUrl<T>(url: string): Promise<T | null> {
        try {
            const jsonObj = this._jsonCache.get(url);
            if (jsonObj) {
                //console.warn(`AssetUrils::readJsonFromUrl() from cache!!!! url = ${url}`);
                return jsonObj as T;
            }

            //console.warn(`AssetUrils::readJsonFromUrl() url = ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                const manifest = await response.json();
                this._jsonCache.set(url, manifest);
                return manifest as T;
            }
            return null;
        }
        catch (ex) {
            console.error(`AssetUtils.readJsonFromUrl() => url '${url}' \n exception: ${ex} `);
            return null;
        }
    }

    /**
     * Url로 부터 Blob데이터를 얻어온다 (Object Url 포함)
     */
    public static async readBlobFromUrl(url: string): Promise<Blob | null> {
        const response = await fetch(url);
        if (response.ok) {
            return await response.blob();
        }
        return null;
    }


    /**
     * 입력받은 str 값을 assetType으로 변환한다
     */
    public static convertStringToAssetType(str: string): eAssetType {
        if ("Item" === str) {
            return eAssetType.Item;
        }
        else if ("Land" === str) {
            return eAssetType.Land;
        }
        else if ("MyRoom" === str) {
            return eAssetType.MyRoom;
        }
        else if ("Avatar" === str) {
            return eAssetType.Avatar;
        }
        else if ("Model_glb" === str) {
            return eAssetType.Model_glb;
        }

        return eAssetType.None;
    }

    public static makeHeader(addApiKey: boolean, addAuth: string, addAccept: boolean, contentType: string) {
        const headers: { [key: string]: string } = {};

        if (addApiKey)
            headers["X-API-KEY"] = Constants.TEST_API_KEY;

        if (addAuth)
            headers["Authorization"] = `Bearer ${addAuth}`;

        if (addAccept)
            headers["accept"] = "application/json";

        if (contentType)
            headers["Content-Type"] = contentType;

        return headers;
    }

    public static printError(desc: string, e: any, url: string): string {
        let msg: string = "";

        if (e.response && e.response.status) {
            if (e.response.data) {
                msg = `[ERROR] ${desc} Error code : ${e.response.status}, ${e.code}, data = ${JSON.stringify(e.response.data)}, url = ${url}`;
            }
            else {
                msg = `[ERROR] ${desc} Error code : ${e.response.status}, ${e.code}! url = ${url}`;
            }
        }
        else if (e.cause) {
            msg = `[ERROR] ${desc} Error occurred : ${e.cause}, ${url}`;
        }
        else {
            msg = `[ERROR] ${desc} Error occurred : ${url}\n${e}`;
        }

        console.error(msg);
        return msg;
    }
}