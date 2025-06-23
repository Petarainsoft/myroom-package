import { app, BrowserWindow, shell, ipcMain, session, Menu, MenuItemConstructorOptions } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { update } from './update';
import createApplicationMenu, { triggerMenu_AssetServerStart } from './menu';
import fs from 'fs';
import path from 'path';
import * as ELogger from 'electron-log';
import { EditorConstants } from '../../core/constant';

import { TableDataManager } from "client-core/tableData/tableDataManager";
import sharp from 'sharp';

import { spawn } from 'child_process';
import { getAppConfigData } from "../../core/back/appConfig";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST;

// Disable GPU Acceleration for Windows 7
//if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

async function createWindow() {
    win = new BrowserWindow({
        title: 'Main window',
        icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
        width: 1300,
        height: 800,
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    });

    if (url) { // electron-vite-vue#298
        win.loadURL(url);
        // Open devTool if the app is not packaged
        //win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml);
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    await new Promise(resolve => setTimeout(resolve, 2500));

    win.webContents.send(EditorConstants.IPC_CHANNEL_SET_EDITOR_MODE, getAppConfigData().editorMode);

    // TableDataManager 초기화
    new TableDataManager();
    TableDataManager.getInstance().loadTableDatas();

    win.focus();
    triggerMenu_AssetServerStart();


    //컴맨드 라인 지원
    let targetDir: string = "";
    if (process.argv.length > 1) {
        targetDir = process.argv[1];
    }

    if (targetDir) {
        //ELogger.log("TargetDir =" + targetDir);
        const itemDir = targetDir;
        const dir = path.basename(itemDir);
        const modelFilePath = path.join(itemDir, `${dir.toString()}.glb`);
        const manifestFilePath = path.join(itemDir, `manifest.json`);
        if (fs.existsSync(modelFilePath)) {
            win.webContents.send('babylon:generateIcons', [modelFilePath], true);
        }
        else if (fs.existsSync(manifestFilePath)) {
            win.webContents.send('babylon:generateIcons', [manifestFilePath], true);
        }
    }
}

createApplicationMenu();

app.whenReady().then(createWindow);

//-------------------------------------------------------------------
// electron event handler
//-------------------------------------------------------------------
app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        session.defaultSession.clearCache();
        createWindow();
    }
});

//-------------------------------------------------------------------
//ipc Handler 등록
//-------------------------------------------------------------------
ipcMain.handle('electron:readJsonFile', async (event, configFilePath) => {
    if (fs.existsSync(configFilePath)) {
        const buffer = fs.readFileSync(configFilePath);
        return JSON.parse(buffer.toString());
    }
    return undefined;

});

ipcMain.handle('electron:readModelFile', async (event, modelFilePath) => {
    if (fs.existsSync(modelFilePath)) {
        return fs.readFileSync(modelFilePath);
    }
    return undefined;
});

ipcMain.handle('electron:saveIconFile', async (event, dir, data) => {
    //const iconFilePath = path.join(dir, "thumbnail-generated.png");
    const iconFilePath = path.join(dir, "thumbnail.png");
    fs.writeFileSync(iconFilePath, data);
    event.sender.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `Icon File Saved : ${iconFilePath}`);
});

ipcMain.handle('electron:saveConfigFile', async (event, dir, data) => {
    const configFilePath = path.join(dir, "generate-icon-config.json");
    fs.writeFileSync(configFilePath, data);
    event.sender.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `Config File Saved : ${configFilePath}`);
});

ipcMain.handle('electron:saveJson', async (event, filename, data) => {
    const jsonFilePath = filename;
    fs.writeFileSync(jsonFilePath, data);
    event.sender.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `파일이 저장되었습니다. : ${jsonFilePath}`);
});

ipcMain.handle('electron:removeFile', async (event, filename) => {
    console.log(filename);
    const jsonFilePath = filename;
    fs.unlinkSync(jsonFilePath);
});

ipcMain.handle('electron:saveImage', async (event, base64Image, filename) => {
    console.log(filename);
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const pngFilePath = filename;
    const ktxFilePath = filename.replace(".png", ".ktx2");

    await sharp(imageBuffer).toFile(pngFilePath);

    const toKtxFilepath = path.resolve(getAppConfigData().itemRootDir + "/../toktx.exe");

    const process = spawn(toKtxFilepath, ["--encode", "uastc", "--uastc_quality", "3", "--zcmp", "18", ktxFilePath, pngFilePath]);
    process.on('exit', (code) => {
        fs.unlinkSync(pngFilePath);
        event.sender.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `파일이 저장되었습니다. : ${ktxFilePath}`);
    });
});

ipcMain.handle('electron:findFiles', async (event, dir, extention) => {
    const files = fs.readdirSync(dir);
    const result: string[] = [];
    files.forEach((file) => {
        if (file.endsWith(extention)) {
            result.push(file);
        }
    });
    return result;
});

ipcMain.handle('electron:readImageFile', async (event, filepath) => {
    if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath);
    }
    return undefined;
});


ipcMain.handle('electron:addFakeItemData', (event, fakeItemId, category1, category2, category3, clientId) => {
    TableDataManager.getInstance().addFakeItemDataForTool(fakeItemId, category1, category2, category3, clientId);
});


ipcMain.handle('electron:quit', async (event) => {
    app.quit();
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${url}#${arg}`);
    } else {
        childWindow.loadFile(indexHtml, { hash: arg });
    }
})

