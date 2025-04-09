import { TableDataManager } from "client-core/tableData/tableDataManager";
import { BrowserWindow, dialog, ipcMain, ipcRenderer, MenuItemConstructorOptions } from "electron";
import fs from 'fs';
import path from 'path';

const template: MenuItemConstructorOptions[] = [
  {
    label: 'Tools',
    submenu: [
      // {
      //   label: 'Generate Item Icons (All)', click: async () => {
      //     const win = BrowserWindow.getFocusedWindow();
      //     if (win) {
      //       const result = await dialog.showOpenDialog(win, { message: "Item (Root) 폴더를 선택해주세요", properties: ['openDirectory'] });
      //       if (!result.canceled) {
      //         const modelFilePaths: string[] = [];
      //         const rootDir = result.filePaths[0];
      //         const itemDirs = fs.readdirSync(rootDir, { withFileTypes: false, recursive: false });
      //         itemDirs.forEach((dir) => {
      //           const itemDir = path.join(rootDir, dir.toString());
      //           if (fs.statSync(itemDir).isDirectory()) {
      //             //thumbnail.png 파일이 존재하는가?
      //             if (!fs.existsSync(path.join(itemDir, "thumbnail.png"))) {
      //               const modelFilePath = path.join(itemDir, `${dir.toString()}.glb`);
      //               //그냥 모델파일만 존재하는가?
      //               if (fs.existsSync(modelFilePath)) {
      //                 modelFilePaths.push(modelFilePath);
      //               }
      //             }
      //           }
      //         });
      //         win.webContents.send('babylon:generateIcons', modelFilePaths);
      //       }
      //     }
      //   },
      // },
      {
        label: 'Generate Item Icon (Selected)', click: async () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            const result = await dialog.showOpenDialog(win, { message: "Item 폴더를 선택해주세요", properties: ['openDirectory'] });
            if (!result.canceled) {
              const itemDir = result.filePaths[0];
              const dir = path.basename(itemDir);
              const modelFilePath = path.join(itemDir, `${dir.toString()}.glb`);
              const manifestFilePath = path.join(itemDir, `manifest.json`);
              if (fs.existsSync(modelFilePath)) {
                win.webContents.send('babylon:generateIcons', [modelFilePath], false);
              }
              else if (fs.existsSync(manifestFilePath)) {
                win.webContents.send('babylon:generateIcons', [manifestFilePath], false);
              }
            }
          }
        }
      },
      {
        label: 'Copy Camera Setting To Clipboard', click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.webContents.send('babylon:copyClipboardCameraSetting');
          }
        }
      },
      {
        label: 'Open DevTool', click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.webContents.openDevTools();
          }
        }
      },
      {
        label: 'Toggle Inspector', click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.webContents.send('babylon:toggleDebugInspector');
          }
        }
      }
    ]
  }
];

export default template;