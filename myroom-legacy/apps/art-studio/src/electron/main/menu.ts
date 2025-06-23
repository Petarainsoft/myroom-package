import { TableDataManager } from "client-core/tableData/tableDataManager";
import { app, BrowserWindow, dialog, MenuItemConstructorOptions, Menu, shell } from "electron";
import fs from 'fs';
import path from 'path';
import express from 'express';
import { startAssetServer, stopAssetServer, isAssetServerRunning } from "../../core/back/assetServer";
import { getAppConfigData, setConfigData_EditorMode, setConfigData_ItemRootDir, setConfigData_UseAssetServer } from "../../core/back/appConfig";

import c from 'ansi-colors';
import { EditorConstants } from "../../core/constant";

const template: MenuItemConstructorOptions[] = [
    //File
    {
        label: 'File',
        submenu: [
            {
                label: '저장하기',
                id: 'File.Save',
                click: () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.send(EditorConstants.IPC_CHANNEL_SAVE);
                    }
                }
            },
            {
                label: 'Open Item Root Dir',
                id: 'File.OpenItemRootDir',
                click: () => {
                    shell.openPath(getAppConfigData().itemRootDir);
                }
            }
        ]
    },
    //Mode
    {
        label: 'Mode',
        submenu: [
            {
                label: 'ItemViewer',
                id: 'Mode.ItemViewer',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        const configData = getAppConfigData();
                        setConfigData_EditorMode("ItemViewer");
                        updateEditorModeMenu();
                        await appQuitForModeChanging();
                    }
                }
            },
            {
                label: 'MaterialEditor',
                id: 'Mode.MaterialEditor',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        const configData = getAppConfigData();
                        setConfigData_EditorMode("MaterialEditor");
                        updateEditorModeMenu();
                        await appQuitForModeChanging();
                    }
                }
            },
            {
                label: 'EquipEditor',
                id: 'Mode.EquipEditor',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        const configData = getAppConfigData();
                        setConfigData_EditorMode("EquipEditor");
                        updateEditorModeMenu();
                        await appQuitForModeChanging();
                    }
                }
            }
        ]
    },
    //AssetServer
    {
        label: 'AssetServer',
        submenu: [
            {
                label: 'Start',
                id: 'AssetServer.Start',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        const configData = getAppConfigData();
                        if (!configData.itemRootDir || fs.existsSync(configData.itemRootDir) === false) {
                            win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_ERROR, '에셋 서버를 시작할수 없습니다. 먼저 ItemRootDir 경로를 설정해 주세요.');
                        }
                        else {
                            win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, '에셋 서버를 시작 중입니다. 잠시만 기다려 주세요..');
                            setConfigData_UseAssetServer(true);
                            startAssetServer(configData.itemRootDir, () => {
                                win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `${c.magenta("에셋서버가 시작했습니다.")} Dir = ${c.green(configData.itemRootDir)}`);
                                updateAssetServerMenu();
                            });
                        }
                    }
                }
            },
            {
                label: 'Stop',
                id: 'AssetServer.Stop',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, '에셋 서버를 종료 중입니다. 잠시만 기다려 주세요. 몇 분이 걸릴 수도 있습니다..');
                        setConfigData_UseAssetServer(false);
                        stopAssetServer(() => {
                            win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, c.magenta('에셋 서버가 종료 되었습니다.'));
                            updateAssetServerMenu();
                        });
                    }
                }
            },
            {
                label: 'Set ItemRootDir',
                id: 'AssetServer.SetItemRootDir',
                click: async () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        const result = await dialog.showOpenDialog(win, { title: "Svn Item 루트 폴더를 선택해주세요", properties: ['openDirectory'] });
                        if (!result.canceled) {
                            const itemDir = result.filePaths[0];
                            setConfigData_ItemRootDir(itemDir);
                            win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, `AssetServer ItemRootDir 경로가 변경되었습니다. ItemRootDir = ${c.green(itemDir)}.`);
                            updateAssetServerMenu();
                        };
                    }
                }
            }
        ]
    },
    //Window
    {
        label: 'Windows',
        submenu: [
            {
                label: 'Open DevTool',
                click: () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.openDevTools();
                    }
                }
            },
            {
                label: 'Toggle DebugLayer',
                click: () => {
                    const win = BrowserWindow.getFocusedWindow();
                    if (win) {
                        win.webContents.send(EditorConstants.IPC_CHANNEL_TOGGLE_DEBUG_LAYER);
                    }
                }
            }
        ]
    }

];

const updateAssetServerMenu = () => {
    const appMenu = Menu.getApplicationMenu();
    if (appMenu) {
        const menuAssetServerStart = appMenu.getMenuItemById('AssetServer.Start');
        if (menuAssetServerStart) {
            menuAssetServerStart.enabled = !isAssetServerRunning();
        }
        const menuAssetServerStop = appMenu.getMenuItemById('AssetServer.Stop');
        if (menuAssetServerStop) {
            menuAssetServerStop.enabled = isAssetServerRunning();
        }
    }
};

const updateEditorModeMenu = () => {
    const appMenu = Menu.getApplicationMenu();
    if (appMenu) {
        const menuModeViewer = appMenu.getMenuItemById('Mode.ItemViewer');
        if (menuModeViewer) {
            menuModeViewer.enabled = getAppConfigData().editorMode !== "ItemViewer";
        }
        const menuModeEditor = appMenu.getMenuItemById('Mode.MaterialEditor');
        if (menuModeEditor) {
            menuModeEditor.enabled = getAppConfigData().editorMode !== "MaterialEditor";
        }
        const menuModeEquip = appMenu.getMenuItemById('Mode.EquipEditor');
        if (menuModeEquip) {
            menuModeEquip.enabled = getAppConfigData().editorMode !== "EquipEditor";
        }
    }
};

export const triggerMenu_AssetServerStart = () => {
    const appConfig = getAppConfigData();
    if (appConfig.useAssetServer === true) {
        const appMenu = Menu.getApplicationMenu();
        if (appMenu) {
            const menuAssetServerStart = appMenu.getMenuItemById('AssetServer.Start');
            if (menuAssetServerStart) {
                menuAssetServerStart.click();
            }
        }
    }
    else {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.webContents.send(EditorConstants.IPC_CHANNEL_LOGGER_LOG, c.magenta("AssetServer를 사용하지 않습니다."));
        }
    }
};

const createApplicationMenu = () => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    updateAssetServerMenu();
    updateEditorModeMenu();
};

const appQuitForModeChanging = async () => {
    await dialog.showMessageBox({
        type: 'question',
        title: '알림',
        message: '모드 전환으로 앱을 종료합니다. 다시 시작해 주세요.',
        buttons: ['Yes']
    });

    app.exit(0);
};

export default createApplicationMenu;