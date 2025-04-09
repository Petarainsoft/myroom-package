import fs from 'fs';
import path from 'path';
import { app } from "electron";

export interface IAppConfigData {
    itemRootDir: string;
    useAssetServer: boolean;
    editorMode: string;
}

export const getAppConfigData = (): IAppConfigData => {
    const appConfigPath = path.join(app.getPath('userData'), "appConfig.json");
    if (fs.existsSync(appConfigPath)) {
        const appConfigData = fs.readFileSync(appConfigPath, "utf8");
        return JSON.parse(appConfigData);
    }
    else {
        return {
            itemRootDir: "",
            useAssetServer: false,
            editorMode: "ItemViewer",
        };
    }
};

export const setConfigData_ItemRootDir = (itemRootDir: string) => {
    const appConfigPath = path.join(app.getPath('userData'), "appConfig.json");
    const configData = getAppConfigData();
    configData.itemRootDir = itemRootDir;
    fs.writeFileSync(appConfigPath, JSON.stringify(configData));
};

export const setConfigData_UseAssetServer = (useAssetServer: boolean) => {
    const appConfigPath = path.join(app.getPath('userData'), "appConfig.json");
    const configData = getAppConfigData();
    configData.useAssetServer = useAssetServer;
    fs.writeFileSync(appConfigPath, JSON.stringify(configData));
};

export const setConfigData_EditorMode = (editorMode: string) => {
    const appConfigPath = path.join(app.getPath('userData'), "appConfig.json");
    const configData = getAppConfigData();
    configData.editorMode = editorMode;
    fs.writeFileSync(appConfigPath, JSON.stringify(configData));
};