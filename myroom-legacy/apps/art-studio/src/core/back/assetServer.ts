import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';

import { TableDataManager } from 'client-core/tableData/tableDataManager';
import { IAssetManifest_Model_glb } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Model_glb';
//http://localhost:9567/items/XxrXYSLhsUhczxlzTfbsm
//http://localhost:9567/AVATAR_RESOURCE/MR_AVATAR_BODY_0002_BLUE/thumbnail.png
//http://localhost:9567/asset/AVATAR_RESOURCE/MR_AVATAR_BODY_0002_BLUE/thumbnail.png

let server: http.Server | undefined = undefined;

const makeItemInfoJson = (itemId: string): any => {
    if (!TableDataManager.getInstance()) {
        return "";
    }

    let baseDir = "";
    const tableData = TableDataManager.getInstance().findItem(itemId);
    if (tableData) {
        const categoryInfo = TableDataManager.getInstance().findCategory3(tableData.category3.toString());
        if (categoryInfo) {
            baseDir = path.join(categoryInfo.SvnFolder, tableData.client_itemid).replaceAll("\\", "/");
            console.log("baseDir = " + baseDir);
        }
    }

    return {
        "option": {
            "version": 1,
        },
        "resource": {
            "manifest": `http://localhost:9567/${baseDir}/manifest.json`,
        }
    };
};

const makeManifestJson_model_glb = (itemDir: string): IAssetManifest_Model_glb => {
    //{"format":3,"main":{"type":"Model_glb","modelfile":"MR_BOOKSHELF_WALL_0001.glb"}}
    const glbFileName = path.basename(itemDir) + ".glb";
    return {
        format: 3,
        main: {
            type: "Model_glb",
            modelfile: glbFileName
        }
    };
};

const makeAssetPackageJson = (itemDir: string): any => {
    const files = fs.readdirSync(itemDir);
    return {
        files: files.map((file) => {
            return path.basename(file);
        }),
    };
};

export const startAssetServer = (itemRootDir: string, callback: () => void) => {
    const app = express();
    const PORT = 9567;

    app.use(cors());

    //상태정보 api
    app.get('/status', (req, res) => {
        res.json({
            "status": "ok",
            "version": 1,
            "message": "AssetServer is running",
        });
    });

    //아아템 정보 api
    app.get('/items/:itemId', (req, res) => {
        const info = makeItemInfoJson(req.params.itemId);
        res.json(info);
    });

    //package.json은 만들어서 보내준다
    app.get('*/package.json', (req, res) => {
        const filepath = path.join(itemRootDir, req.path);
        const packageJson = makeAssetPackageJson(path.dirname(filepath));
        res.json(packageJson);
    });

    //manifest.json가 없을 경우 기본 glb manifest를 생성한다
    app.get('*/manifest.json', (req, res) => {
        const filepath = path.join(itemRootDir, req.path);
        if (!fs.existsSync(filepath)) {
            const mainfest = makeManifestJson_model_glb(path.dirname(filepath));
            res.json(mainfest);
        }
        else {
            res.sendFile(filepath);
        }
    });

    //정적 파일 서비스
    app.use(express.static(itemRootDir));
    server = app.listen(PORT, callback);
};


export const stopAssetServer = (callback: () => void) => {
    if (server !== undefined) {
        server.close(callback);
        server = undefined;
    }
};

export const isAssetServerRunning = (): boolean => {
    return server !== undefined;
};