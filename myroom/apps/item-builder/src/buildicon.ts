import path from 'path';
import { Constants } from "client-core/assetSystem/constants";
import { TableDataManagerNoRuntime } from "./buildProcess/tableDataManagerNoRuntime";
import { ItemBuilderParams } from "./misc/itemBuilderParams";
import { ItemBuilderPath } from "./misc/itemBuilderPath";
import { ItemBuilderUtil } from "./misc/itemBuilderUtil";
import { exec as originalExec } from "child_process";
import { promisify } from "util";

const exec = promisify(originalExec);

export class BuildIcon
{
    private static generatoeExePath: string = "";
    public static skipList: { [key: string]: string; } = {};
    public static successList: { [key: string]: string; } = {};
    public static errorList: { [key: string]: string; } = {};

    public static async run()
    {
        console.log("BuildIcon::run()");
        ItemBuilderParams.Initialize();

        this.generatoeExePath = path.join(ItemBuilderParams.getIconGeneratorSvnRoot(), Constants.ICON_GENERATOR_FILE_NAME);
        this.skipList = {};
        this.successList = {};
        this.errorList = {};

        const dataManager = new TableDataManagerNoRuntime();
        const jsonRoot = ItemBuilderParams.getRoot_Work_JsonData();
        await dataManager.loadTableDatasForLocalMode(jsonRoot);

        for (const key in dataManager.items)
        {
            const item = dataManager.items[key];
            const category3 = dataManager.findCategory3(item.category3.toString());
            if (!item)
            {
                this._addErrorList(key, `Invalid ItemData. key = '${key}'`);
                continue;
            }

            if (!category3)
            {
                this._addErrorList(key, `Invalid ItemCategory3. key = '${key}'`);
                continue;
            }

            if (!category3.GenerateThumbnail)
            {
                console.log(`category3.GenerateThumbnail is false. key='${key}' category3='${category3.ID}'`);
                this._addSkipList(key, `GenerateThumbnail = false`);
                continue;
            }

            const itemSvnRoot = ItemBuilderPath.getSvnItemPath(item, category3);
            if (!ItemBuilderUtil.isExistPath(itemSvnRoot))
            {
                const desc:string = `Not found original resource root. item_id='${key}' path='${itemSvnRoot}'.`;
                this._addErrorList(key, `${desc}`);
                continue;
            }

            const thumbnailDstPath = ItemBuilderPath.getThumbnailPath(item, category3);
            if (ItemBuilderUtil.isExistPath(thumbnailDstPath))
            {
                const desc:string = `Already exist '${Constants.THUMBNAIL_FILENAME}'. item_id='${key}' path='${thumbnailDstPath}'.`;
                this._addSkipList(key, desc);
                continue;
            }

            const res:{code: number, error: string} = await this._callIconGenerate(itemSvnRoot);
            if (res.code !== 0)
            {
                if (res.code === Constants.ICON_GENERATOR_EXIT_CODE_SKIP)
                {
                    this._addSkipList(key, `Generator system skip. exitcode='${res.code}, ${res.error}'`);
                    continue;
                }

                this._addErrorList(key, `Generator system error. exitcode='${res.code}, ${res.error}'`);
                continue;
            }

            if (!ItemBuilderUtil.isExistPath(thumbnailDstPath))
            {
                const desc:string = `Not found '${Constants.THUMBNAIL_FILENAME}'. item_id='${key}' path='${thumbnailDstPath}'.`;
                this._addErrorList(key, desc);
                continue;
            }

            this._addSuccessList(key, `Generate thumbnail success. item_id='${key}' path='${thumbnailDstPath}'.`);
        }

        this._printSkipItems();
        this._printSuccessItems();
        this._printErrorItems();

        const errorLen = Object.keys(this.errorList).length;
        if (errorLen > 0)
        {
            console.error(`GenerateIcon::run() hasFaildItem()`);
            process.exit(1);
        }


        console.log(`GenerateIcon::run() DEV_ENV = '${Constants.DEV_ENV}'`);
        console.log(`GenerateIcon::run() BASEURL_API = '${Constants.BASEURL_API}'`);
    }

    private static async _callIconGenerate(itemSvnRoot: string): Promise<{code: number, error: string}>
    {
        try
        {
            //console.log(`GenerateIcon::_callIconGenerate() ${this.generatoeExePath}`);
            const command = `${this.generatoeExePath} ${itemSvnRoot}`;
            const { stdout, stderr } = await exec(command);
            console.log(`GenerateIcon::_callIconGenerate()
            itemSvnRoot='${itemSvnRoot}'
            stdout => ${stdout}
            stderr => ${stderr}
            `);

            return { code: 0, error: "" };  // 정상 종료 시의 결과 코드
        }
        catch (error: any)
        {
            const desc = `Failed Generate icon. itemDstRoot='${itemSvnRoot}' => ${error}`;
            return {
                code: error.code ?? -1,  // error.code가 없는 경우 -1을 반환
                error: desc
            };
        }
    }
    
    private static _addSkipList(itemId:string, desc:string)
    {
        this.skipList[itemId] = `${desc}`;
    }

    private static _addSuccessList(itemId:string, desc:string)
    {
        this.successList[itemId] = `${desc}`;
    }

    private static _addErrorList(itemId:string, desc:string)
    {
        this.errorList[itemId] = `${desc}`;
    }

    private static _printSkipItems()
    {
        console.log(`[print_skip_items] ==============================================`);
        for (const key in this.skipList)
        {
            const desc = this.skipList[key];
            console.log(`[SKIP ICON GENERATE] ${desc}`);
        }
        console.log(`-----------------------------------------------------------------`);
    }

    private static _printSuccessItems()
    {
        console.log(`[print_success_items] ==============================================`);
        for (const key in this.successList)
        {
            const desc = this.successList[key];
            console.log(`[ICON GENERATE] ${desc}`);
        }
        console.log(`-----------------------------------------------------------------`);
    }

    private static _printErrorItems()
    {
        console.log(`[print_error_items] ==============================================`);
        for (const key in this.errorList)
        {
            const desc = this.errorList[key];
            console.log(`[ERROR ICON GENERATE] ${desc}`);
        }
        console.log(`-----------------------------------------------------------------`);
    }
}

await BuildIcon.run();