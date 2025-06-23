import axios from "axios";
import { ITableDataManager } from "../assetSystem/definitions";
import { ItemData, ItemCategory1, ItemCategory2, ItemCategory3, BalloonResource, CameraSetting, OutSide, ItemGrid, DialogMain, DialogText, DialogResult } from "./defines/System_Interface";
import { Constants } from "../assetSystem/constants";
import { Nullable } from "@babylonjs/core";
import { getRandomElements } from "../common/utils";
import { EFuntionType, EItemCategory1, EItemCategory2, EItemCategory3, EPlacementAttachType, EPriceType, ESaleStatus } from "./defines/System_Enum";

export class TableDataManager implements ITableDataManager {
    private static _instance: TableDataManager; //읽기만 사용하므로 singleton으로 그대로 사용한다!!
    private _loaded: boolean = false;

    public items: { [key: string]: ItemData; } = {};
    public category1: { [key: string]: ItemCategory1; } = {};
    public category2: { [key: string]: ItemCategory2; } = {};
    public category3: { [key: string]: ItemCategory3; } = {};
    public balloonResources: { [key: string]: BalloonResource; } = {};
    public cameraSetting: { [key: string]: CameraSetting; } = {};
    public outsidePosList: OutSide[] = [];
    public itemgrids: { [key: string]: ItemGrid; } = {};
    public dialogMains: { [key: string]: DialogMain; } = {};
    public dialogTexts: { [key: string]: DialogText; } = {};
    public dialogResults: { [key: string]: DialogResult; } = {};

    constructor() {
        TableDataManager._instance = this;
    }

    async loadTableDatas(): Promise<void> {
        /*
        https://public.develop.colorver.se/resource/OutSide.json
        */
        const baseUrl = `${Constants.BASEURL_PUBLIC}/resource`;

        const url_item = `${baseUrl}/item.json`;
        const url_category1 = `${baseUrl}/EItemCategory1.json`;
        const url_category2 = `${baseUrl}/EItemCategory2.json`;
        const url_category3 = `${baseUrl}/EItemCategory3.json`;
        const url_balloonResource = `${baseUrl}/BalloonResource.json`;
        const url_camerasettings = `${baseUrl}/CameraSetting.json`;
        const url_outside = `${baseUrl}/OutSide.json`;
        const url_itemgrid = `${baseUrl}/ItemGrid.json`;
        const url_dialogMain = `${baseUrl}/DialogMain.json`;
        const url_dialogText = `${baseUrl}/DialogText.json`;
        const url_dialogResult = `${baseUrl}/DialogResult.json`;

        this.items = await this._loadItemsFromCDN<ItemData>(url_item);

        this.category1 = await this._loadItemsFromCDN<ItemCategory1>(url_category1);
        this.category2 = await this._loadItemsFromCDN<ItemCategory2>(url_category2);
        this.category3 = await this._loadItemsFromCDN<ItemCategory3>(url_category3);
        this.balloonResources = await this._loadItemsFromCDN<BalloonResource>(url_balloonResource);
        this.cameraSetting = await this._loadItemsFromCDN<CameraSetting>(url_camerasettings);
        this.outsidePosList = await this._loadArrayFromCDN<OutSide>(url_outside);
        this.itemgrids = await this._loadItemsFromCDN<ItemGrid>(url_itemgrid);
        this.dialogMains = await this._loadItemsFromCDN<DialogMain>(url_dialogMain);
        this.dialogTexts = await this._loadItemsFromCDN<DialogText>(url_dialogText);
        this.dialogResults = await this._loadItemsFromCDN<DialogResult>(url_dialogResult);
        this._adjustDialogData();

        this._loaded = true;
    }

    isLoaded(): boolean {
        return this._loaded;
    }

    findItem(id: string): Nullable<ItemData> {
        return this.items[id];
    }

    findCategory1(id: string): Nullable<ItemCategory1> {
        return this.category1[id];
    }

    findCategory2(id: string): Nullable<ItemCategory2> {
        return this.category2[id];
    }

    findCategory3(id: string): Nullable<ItemCategory3> {
        return this.category3[id];
    }

    findBalloonResource(id: string): Nullable<BalloonResource> {
        return this.balloonResources[id];
    }

    findCameraSetting(id: string): Nullable<CameraSetting> {
        return this.cameraSetting[id];
    }

    findItemByClientID(clientID: string): Nullable<ItemData> {
        for (const key in this.items) {
            const item = this.items[key];
            if (item.client_itemid === clientID) {
                return item;
            }
        }
        return null;
    }

    addFakeItemDataForTool(fakeItemId: string, category1: EItemCategory1, category2: EItemCategory2, category3: EItemCategory3, clientID: string) {
        const itemData: ItemData = {
            ID: fakeItemId,
            use_status: "",
            title: "",
            desc: "",
            hashtag: [],
            category1: category1,
            category2: category2,
            category3: category3,
            sale_status: ESaleStatus.NONE,
            price_type: EPriceType.FREE,
            price_amount: 0,
            client_itemid: clientID,
            placement_attach_type: EPlacementAttachType.None,
            sw: 0,
            sh: 0,
            useGrids: [],
            funtion: EFuntionType.NONE,
            link_address: "",
            funtion_address: "",
        };

        this.items[fakeItemId] = itemData;
    }

    getOutSidePos(count: number): OutSide[] {
        return getRandomElements(this.outsidePosList, count);
    }

    findItemGrid(id: string): Nullable<ItemGrid> {
        return this.itemgrids[id];
    }

    findDialogMain(id: string): Nullable<DialogMain> {
        return this.dialogMains[id];
    }

    getDialogList(dialogMainId: string): Map<string, DialogText> {
        const map = new Map<string, DialogText>();
        for (const key in this.dialogTexts) {
            const dialogText = this.dialogTexts[key];
            if (dialogText.DialogMainID === dialogMainId) {
                map.set(dialogText.ID, dialogText);
            }
        }
        return map;
    }

    findDialogText(id: string): Nullable<DialogText> {
        return this.dialogTexts[id];
    }
    getDialogResultList(dialogMainId: string): DialogResult[] {
        const list: DialogResult[] = [];
        for (const key in this.dialogResults) {
            const dialogResult = this.dialogResults[key];
            if (dialogResult.DialogMainID === dialogMainId) {
                list.push(dialogResult);
            }
        }
        return list;
    }
    findDialogResult(id: string): Nullable<DialogResult> {
        return this.dialogResults[id];
    }
    
 
    private async _loadItemsFromCDN<T>(url: string): Promise<{ [key: string]: T; }> {
        try {
            const response = await axios.get(url);
            return this._loadItemsFromJson<T>(response.data);

        }
        catch (error) {
            console.error(`TableDataManager::_loadItemsFromCDN() Failed load json. url='${url}', Error downloading JSON file='${error}'`);
            throw error;
        }
    }

    private async _loadArrayFromCDN<T>(url: string): Promise<T[]> {
        try {
            const response = await axios.get(url);

            // const arr = [];
            // for (const key in response.data) {
            //     if (Object.prototype.hasOwnProperty.call(response.data, key)) {
            //         const itemData = response.data[key];
            //         arr.push(itemData);
            //     }
            // }

            // return arr;
            return this._loadItemArrayFronJson<T>(response.data);
        }
        catch (error) {
            console.error(`TableDataManager::_loadArrayFromCDN() Failed load json. url='${url}', Error downloading JSON file='${error}'`);
            throw error;
        }
    }

    protected async _loadItemArrayFronJson<T>(jsonData: any): Promise<T[]> {
        try {
            const arr = [];
            for (const key in jsonData) {
                if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
                    const itemData = jsonData[key];
                    arr.push(itemData);
                }
            }

            return arr;
        }
        catch (error) {
            console.error(`TableDataManager::_loadItemArrayFronJson() Failed load json. Error downloading JSON file='${error}'`);
            throw error;
        }
    }


    protected async _loadItemsFromJson<T>(jsonData: any): Promise<{ [key: string]: T; }> {
        try {
            const dic: { [key: string]: T; } = {};
            for (const key in jsonData) {
                if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
                    const itemData = jsonData[key];
                    dic[key] = itemData;
                }
            }

            return dic;
        }
        catch (error) {
            console.error('Error loading items from file:', error);
            return {};
        }
    }

    public static getInstance(): TableDataManager {
        return this._instance;
    }

    private _adjustDialogData() {
        for (const key in this.dialogMains) {
            const dialogMain = this.dialogMains[key];
            if (dialogMain) {
                dialogMain.TitleLocalKey = dialogMain.TitleLocalKey.replace("_", ".");
                dialogMain.StartLocalKey = dialogMain.StartLocalKey.replace("_", ".");
                dialogMain.TitleButtonLocalKey = dialogMain.TitleButtonLocalKey.replace("_", ".");
            }
        }
        for (const key in this.dialogTexts) {
            const dialogText = this.dialogTexts[key];
            if (dialogText) {
                dialogText.LocalKey = dialogText.LocalKey.replace("_", ".");
                dialogText.AnswerID = dialogText.AnswerID.filter(_=>_!=='');
            }
        }
        for(const key in this.dialogResults){
            const dialogResult = this.dialogResults[key];
            if(dialogResult){
                dialogResult.ResultSubTitle0LocalKey = dialogResult.ResultSubTitle0LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultMainTitle0LocalKey = dialogResult.ResultMainTitle0LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultSubTitle1LocalKey = dialogResult.ResultSubTitle1LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultMainTitle1LocalKey = dialogResult.ResultMainTitle1LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultText1LocalKey = dialogResult.ResultText1LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultSubTitle2LocalKey = dialogResult.ResultSubTitle2LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultMainTitle2LocalKey = dialogResult.ResultMainTitle2LocalKey?.replace("_", ".")??undefined;
                dialogResult.ResultText2LocalKey = dialogResult.ResultText2LocalKey?.replace("_", ".")??undefined;

            }
        }
    }
}