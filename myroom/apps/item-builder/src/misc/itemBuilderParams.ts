import { Constants } from 'client-core/assetSystem/constants';
import fs from 'fs';

enum ParamKeys
{
    KEY_C_ITEM_BUILD_ROOT                   = "C_ITEM_BUILD_ROOT",
    KEY_C_ITEM_BUILD_JSONDATA_ROOT          = "C_ITEM_BUILD_JSONDATA_ROOT",
    KEY_C_ITEM_BUILD_CACHE_FILE_ROOT        = "C_ITEM_BUILD_CACHE_FILE_ROOT",
    KEY_C_SVN_ROOT                          = "C_SVN_ROOT",
    KEY_C_ICON_GENERATOR_SVN_BINARY_ROOT    = "C_ICON_GENERATOR_SVN_BINARY_ROOT",
    KEY_C_API_ADMIN_ID                      = "C_API_ADMIN_ID",
    KEY_C_API_ADMIN_PW                      = "C_API_ADMIN_PW",
}

export class ItemBuilderParams
{
    private static parameters: { [key: string]: string } = {};

    public static Initialize()
    {
        ItemBuilderParams.parseParameters();
        ItemBuilderParams.printParameters();
        if (!ItemBuilderParams.isValidParameters())
        {
            console.warn(`ItemBuilderParams::Initialize() Invalid Parameters. then SetParameters_ForTest()`);

            ItemBuilderParams.SetParameters_ForTest();
            ItemBuilderParams.printParameters();
            if (!ItemBuilderParams.isValidParameters())
            {
                console.error(`ItemBuilderParams::Initialize() Invalid Parameters`);
                process.exit(100);
            }
        }
    }

    private static SetParameters_ForTest()
    {
        console.log("ItemBuilderParams::SetParameters_ForTest()");
        this.parameters = {};

        const debugParameterPath = `C:\\Temp\\ItemBuild\\ItemBuildDebugParameters_${Constants.DEV_ENV}.json`;
        const fileData = fs.readFileSync(debugParameterPath, 'utf8');
        const jsonData = JSON.parse(fileData);

        for (const key in jsonData)
        {
            this.SetParameter(key, jsonData[key]);
        }
    }

    private static parseParameters()
    {
        console.log("ItemBuilderParams::parseParameters()");

        this.parameters = {};

        const values = Object.values(ParamKeys) as string[];
        for (const key of values)
        {
            this.addParameterByKey(key);
        }
    }

    private static addParameterByKey(key: string)
    {
        this.SetParameter(key, process.env[key] || "");
    }

    private static SetParameter(key: string, val: string)
    {
        this.parameters[key] = val;
    }

    public static isValidParameters(): boolean
    {
        for (const key in ParamKeys)
        {
            if (isNaN(Number(key)))
            {
                const paramKey = ParamKeys[key as keyof typeof ParamKeys].toString();
                if (!(paramKey in this.parameters) || this.parameters[paramKey] === "")
                {
                    console.error(`ItemBuilderParams::isValidParameters() key '${paramKey}' is missing or has an empty value.`);
                    return false;
                }
            }
        }
        
        return true;
    }

    public static printParameters()
    {
        let desc = "ItemBuilderParams::printParameters()\n";
        
        const keys = Object.values(ParamKeys) as string[];
        for (const key of keys)
        {
            //console.log(`ItemBuilderParams::printParemeters() ${key}=${this.getValueByString(key)}`);

            let val = this.getValueByString(key);
            if (key === ParamKeys.KEY_C_API_ADMIN_PW && val)
            {
                val = "**********";
            }
            desc += `\t${key}=${val}\n`;
        }

        desc += "\n";
        console.log(desc);
    }

    public static getBuildRoot(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_ITEM_BUILD_ROOT);
    }

    public static getRoot_Work_JsonData(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_ITEM_BUILD_JSONDATA_ROOT);
    }

    public static getRoot_ItemBuild_Cache(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_ITEM_BUILD_CACHE_FILE_ROOT);
    }

    public static getSvnRoot(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_SVN_ROOT);
    }

    public static getIconGeneratorSvnRoot(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_ICON_GENERATOR_SVN_BINARY_ROOT);
    }

    public static getApiAdminId(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_API_ADMIN_ID);
    }

    public static getApiAdminPw(): string
    {
        return this.getValueByEnum(ParamKeys.KEY_C_API_ADMIN_PW);
    }

    private static getValueByEnum(key: ParamKeys): string
    {
        return this.getValueByString(key.toString());
    }

    private static getValueByString(key: string): string
    {
        if (key in this.parameters)
        {
            return this.parameters[key];
        }
        else
        {
            console.log(`ItemBuilderParams::getParamValue() Parameter key '${key}' not found.`);
            return "";
        }
    }
}