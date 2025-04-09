import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { AssetUtils } from "../../../../packages/client-core/assetSystem/assetUtils";
import { Constants } from "../../../../packages/client-core/assetSystem/constants";
import { ItemBuilderParams } from "../misc/itemBuilderParams";
import { ItemData } from '../../../../packages/client-core/tableData/defines/System_Interface';
import { EItemCategory3 } from 'client-core/tableData/defines/System_Enum';
import { TableDataManager } from 'client-core/tableData/tableDataManager';

export class RefError
{
    public msg:string = "";
}
export class BackendAPI
{
    private _bearerToken:string = "";

    public async login(): Promise<boolean>
    {
        //const url = `${Constants.BASE_URL_API}/auth/signin/email?w=${Constants.TEST_WORLD_ID}&p=p`;
        const url = `${Constants.BASEURL_API}/auth/signin/email`;

        try
        {
            const data: { [key: string]: string } = {};

            data['id']          = ItemBuilderParams.getApiAdminId();
            data['password']    = ItemBuilderParams.getApiAdminPw();

            const headers = AssetUtils.makeHeader(true, "", true, "application/json");

            const params = { w: `${Constants.TEST_WORLD_ID}` };

            const response = await axios.post(url, data, {headers:headers, params:params});

            const resData = response.data;
            console.log('BackendApi::login() : ', resData);

            this._bearerToken = response.data.credential.access_token;
            // _accessToken = (string)jObj["credential"]["access_token"];
            // _refreshToken = (string)jObj["credential"]["refresh_token"];
            // _token_expire_seconds = (uint)jObj["credential"]["expires"];

            console.log('Bearer Token:', this._bearerToken);

            return true;
        }
        catch (error:any)
        {
            //console.log('Bearer Token:', error);
            AssetUtils.printError("BackendApi::login()", error, url);
            return false;
            //process.exit(1);
        }
    }

    public async uploadResource(item:ItemData, zipFilePath:string, refErr:RefError): Promise<any>
    {
        const url = `${Constants.BASEURL_API}/meta/resources`;

        try
        {
            const headers = AssetUtils.makeHeader(true, this._bearerToken, true, "multipart/form-data");
            
            const data: { [key: string]: string } = { Type:'Item', target_id: item.ID };
            
            const formData = new FormData();
            formData.append('File', fs.createReadStream(zipFilePath));
        
            for (const key in data)
            {
                formData.append(key, data[key]);
            }

            const response = await axios.post(url, formData, { headers:headers});
            const resData = response.data;
            
            //console.log('uploadResource() : ', resData);
            //console.log(`BackendApi::uploadResource() itemId = ${item.ID}, zipPath = ${zipFilePath}`);

            return resData;
        }
        catch (error:any)
        {
            refErr.msg = AssetUtils.printError(`BackendApi::uploadResource() ${item.ID}, `, error, url);
            //console.error('[ERROR] uploadResource() Failed to fetch :', error);
        }

        return "";
    }

    public async registeItem(item:ItemData, data:any, refErr:RefError): Promise<boolean>
    {
        //const url = `https://admin.develop.colorverseapis.com/v1/meta/item/${item.ID}`;
        const url = `${Constants.BASEURL_API}/meta/items/${item.ID}`

        try
        {
            const headers = AssetUtils.makeHeader(true, this._bearerToken, true, "application/json");
            //const params = { item_id:item.ID, force: true };
            const params = { force: true };
            const response = await axios.post(url, data, {headers: headers, params:params});

            const resData = response.data;
            
            //console.log('updateItemInfo() : ', resData);
            console.log(`BackendApi::registeItem() data : item id = '${item.ID}', data = ${JSON.stringify(data)}`);

            return resData;
        }
        catch (error:any)
        {
            refErr.msg = AssetUtils.printError(`BackendApi::registeItem() ${item.ID}, data=${JSON.stringify(data)} `, error, url);
            //console.error(`BackendApi::updateItemInfo() tried request data = ${JSON.stringify(data)}`);

            //console.error('[ERROR] updateItemInfo() Failed to fetch :', error);
            return false;
        }
    }

    public async updateItem(item:any, data:any, refErr:RefError): Promise<boolean>
    {
        //console.log(`BackendApi::updateItem() data : item id='${item.ID}', data=${JSON.stringify(data)}`);
        refErr.msg = "";
        //return false;

        const url = `${Constants.BASEURL_API}/meta/items/${item.ID}`

        try
        {
            const headers = AssetUtils.makeHeader(true, this._bearerToken, true, "application/json");
            //const params = { item_id:item.ID, force: true };
            const params = { force: true };
            const response = await axios.patch(url, data, {headers: headers, params:params});

            const resData = response.data;
            
            //console.log('updateItemInfo() : ', resData);
            console.log(`BackendApi::updateItem() data : item id = '${item.ID}', data = ${JSON.stringify(data)}`);

            return resData;
        }
        catch (error:any)
        {
            refErr.msg = AssetUtils.printError(`BackendApi::updateItem() ${item.ID}, data=${JSON.stringify(data)} `, error, url);
            //console.error(`BackendApi::updateItem() tried request data = ${JSON.stringify(data)}`);

            //console.error('[ERROR] updateItem() Failed to fetch :', error);
            return false;
        }
    }

    public async deleteItem(item:any, refErr:RefError): Promise<boolean>
    {
        console.log(`BackendApi::deleteItem() data : item id='${item.ID}'`);
        refErr.msg = "";
        //return false;

        const url = `${Constants.BASEURL_API}/meta/items/${item.ID}`

        try
        {
            const headers = AssetUtils.makeHeader(true, this._bearerToken, true, "application/json");
            await axios.delete(url, {headers: headers});

            //delete는 response data 없고 200이면 무조건 성공
            //const response = await axios.delete(url, {headers: headers});
            //const resData = response.data;
            return true
        }
        catch (error:any)
        {
            refErr.msg = AssetUtils.printError(`BackendApi::deleteItem() ${item.ID}. `, error, url);
            console.error(`BackendApi::deleteItem() request error = ${error}`);

            //console.error('[ERROR] deleteItem() Failed to fetch :', error);

            if (error.response && error.response.data)
            {
                const resData = error.response.data;
                if (resData.error === 404 ||   // 존재하지않는 아이템
                    resData.error === 29001 )   // 이미 삭제된 아이템
                {
                    // 다시 시도하지 않도록 성공으로 간주
                    return true;
                }
            }

            return false;
        }
    }




    public makeUpdateItemInfo(item:any, version:number):any
    {
        const language = 'ko';

        const data_txt_title: { [key: string]: string } = {};
        data_txt_title[language] = item.title;

        const data_txt_desc: { [key: string]: string } = {};
        
        const data_txt: { [key: string]: object } = {};
        data_txt['title'] = data_txt_title;

        data_txt_desc[language] = (item.desc ? item.desc : "");
        data_txt['desc'] = data_txt_desc;
        
        data_txt['system_hashtag'] = ('hashtag' in item ? item.hashtag : []);

        const data_option: { [key: string]: object } = {};
        data_option['version'] = JSON.parse(`${version}`);
        data_option['category'] = [item.category1, item.category2, item.category3];
        data_option['sale_status'] = JSON.parse(`${item.sale_status}`);
        data_option['price'] = { type:item.price_type, amount:item.price_amount };

        //console.log(`ttttttttttttt - ${data_option['version']}, ${resourceInfo.version}, ${resourceInfo}`);

        const data: { [key: string]: object } = {};
        data['txt'] = data_txt;
        data['option'] = data_option;

        const extraInfo = this.MakeExtraInfo(item);
        //data['extra_info'] = (extraInfo ? extraInfo : {});
        if (extraInfo)
        {
            data['extra_info'] = extraInfo;
        }
        
        return data;
    }

    private MakeExtraInfo(item:ItemData):any | null
    {
        if (item.category3 === EItemCategory3.BALLOON)
        {
            const balloonItem = TableDataManager.getInstance().findBalloonResource(item.ID);
            if (balloonItem)
            {
                const grade = balloonItem.BalloonGradeID;
                return {  balloon: { grade } };
            }
            else
            {
                console.error(`BackendApi::MakeExtraInfo() not found balloon resource. item id = ${item.ID}`);
            }
        }

        return null;
    }
}