import { IAssetPackageFileSystem, eAssetType } from "../../assetSystem/definitions";
import { openDB, IDBPDatabase } from 'idb';

type TAssetDataType = {
  [key: string]: Blob | ArrayBuffer | undefined;
};

interface IAssetDataType {
  id: string;
  version: number;
  data: TAssetDataType | undefined;
}

export class AssetPackageFileSystem_IDB implements IAssetPackageFileSystem {
  private _DB_NAME = 'ASSETS';
  private _DB_VERSION = 1;

  private _IDB: Promise<IDBPDatabase> | undefined = undefined;

  private _rootLand: string = 'space/land';
  private _rootAvatar: string = 'space/avatar';
  private _rootItem: string = 'meta/item';

  constructor() {
    this._initialize();
  }

  /**
   * 해당 에셋의 존재여부를 반환
   * @param assetType
   * @param assetId
   * @param version
   * @returns
  */
  async isAssetDirExists(assetType: eAssetType, assetId: string, version: number): Promise<boolean> {
    const idb = await this._IDB;
    if (!idb) return false;

    const objectStoreName = this._getObjectStoreByAssetType(assetType);
    try {
      const item = await idb.get(objectStoreName, [assetId, version]);
      if (item) return true;
      else {
        console.log('AssetIndexedDB.isAssetDirExists() => asset does not exist: ');
        return false;
      }

    } catch (error) {
      console.log('AssetIndexedDB.isAssetDirExists() => ObjectStore missing ', error);
      return false;
    }
  }

  /**
   * 해당 에셋에 해당하는 디렉토리를 생성
   * @param assetType
   * @param assetId
   * @param version
  */
  async createAssetDir(assetType: eAssetType, assetId: string, _version: number): Promise<boolean> {
    const idb = await this._IDB;
    if (!idb) return false;

    const objectStoreName = this._getObjectStoreByAssetType(assetType);
    if (objectStoreName) {
      try {
        const fileTemplate: IAssetDataType = {
          id: assetId,
          version: _version,
          data: undefined
        };
        await idb.add(objectStoreName, fileTemplate);
      }
      catch (ex) {
        console.log('AssetIndexedDB.createAssetDir() => ', ex);
      }
    }

    return true;
  }

  /**
   * 에셋 폴더 제거
   * @param assetType
   * @param assetId
   * @returns
  */
  async deleteAssetDir(assetType: eAssetType, assetId: string): Promise<boolean> {
    console.log('deleteAssetDir: ', assetId);
    const idb = await this._IDB;
    if (!idb) return false;

    const objectStoreName = this._getObjectStoreByAssetType(assetType);
    if (objectStoreName) {
      try {
        // 삭제 시 모든 version 삭제
        (await idb.getAllKeys(objectStoreName)).map(async (assetKey: any) => {
          if (assetKey[0] === assetId) await idb.delete(objectStoreName, assetKey);
        });
      }
      catch (ex) {
        console.log('AssetIndexedDB.deleteAssetDir() => ', ex);
        return false;
      }
    }

    return true;
  }

  /**
   * 해당 에셋에 파일을 생성
   * @param assetType
   * @param assetId
   * @param version
   * @param fileName
   * @param data
   * @returns
  */
  async createAssetFile(assetType: eAssetType, assetId: string, version: number, filename: string, _data: Blob): Promise<boolean> {
    const idb = await this._IDB;
    if (!idb) return false;

    const objectStoreName = this._getObjectStoreByAssetType(assetType);
    if (objectStoreName) {
      try {
        console.log('createAssetFileIDB params ', objectStoreName, assetId, version, filename, _data);
        let file = await idb.get(objectStoreName, [assetId, version]);
        const fileKey = filename;
        file.data = {
          ...file.data,
          [fileKey]: _data
        };
        await idb.put(objectStoreName, file);
      }
      catch (ex) {
        console.log('AssetIndexedDB.createAssetFile() => ', ex);
        return false;
      }
    }

    return true;
  }

  /**
   * 해당 에셋에서 파일을 읽음
   * @param assetType
   * @param assetId
   * @param filename
   * @returns
  */
  async readAssetFile(assetType: eAssetType, assetId: string, version: number, filename: string): Promise<Blob | null> {
    const idb = await this._IDB;
    if (!idb) return null;

    const objectStoreName = this._getObjectStoreByAssetType(assetType);
    if (objectStoreName) {
      try {
        console.log('readAssetFile ', assetType, objectStoreName, [assetId, version]);
        const file = await idb.get(objectStoreName, [assetId, version]);

        return file.data[filename];

      } catch (ex) {
        console.log('AssetIndexedDB.readAssetFile() => ', ex);
        return null;
      }
    }

    return null;
  }

  /**
   * 캐쉬를 비웁니다.
  */
  async clear(): Promise<void> {
    const idb = await this._IDB;
    if (!idb) return;

    await idb.clear(this._rootItem);
    await idb.clear(this._rootAvatar);
    await idb.clear(this._rootLand);
  }

  /**
   * 에셋 타입에 따른 objectstore 반환 (_getRootDirByAssetType 과 역할)
   * @param assetType
   * @returns
  */
  private _getObjectStoreByAssetType(assetType: eAssetType): string {
    console.log('_getObjectStoreByAssetType ', assetType);
    if (eAssetType.Land === assetType) return this._rootLand;
    else if (eAssetType.Avatar === assetType) return this._rootAvatar;

    return this._rootItem;
  }


  /** ios Blob 저장 문제 있을 시 arrayBuffer 로 대체필요 */
  // function arrayBufferToBlob(buffer, type) {
  //   return new Blob([buffer], { type: type });
  // }

  // function blobToArrayBuffer(blob) {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.addEventListener('loadend', () => {
  //       resolve(reader.result);
  //     });
  //     reader.addEventListener('error', reject);
  //     reader.readAsArrayBuffer(blob);
  //   });
  // }

  // private _checkUserAgent(): string {
  //   const userAgent = window.navigator.userAgent.toLowerCase();

  //   const safari = /safari/.test(userAgent);
  //   const ios = /iphone|ipod|ipad|macintosh/.test(userAgent);

  //   if (ios) {
  //     if (safari) {
  //       // browser
  //     } else {
  //       // webview
  //     }
  //   } else {

  //   }
  //   // const isWebviewIos = typeof window.webkit !== 'undefined';
  //   // const isWebviewAndroid = typeof window.Android !== 'undefined';
  //   return '1';
  // }

  /**
   * IndexedDB 초기화
   * @returns
  */
  private async _initialize(): Promise<boolean> {
    try {
      this._IDB = openDB(this._DB_NAME, this._DB_VERSION, {
        upgrade(database) {
          database.createObjectStore('space/avatar', { keyPath: ['id', 'version'] });
          database.createObjectStore('space/land', { keyPath: ['id', 'version'] }); // 변경 시 keypath 설정 필요
          database.createObjectStore('meta/item', { keyPath: ['id', 'version'] });
          // const store = database.createObjectStore('meta/item', { keyPath: 'id' });
          // store.createIndex('idx', 'id');
        }
      });
      return true;
    }
    catch (ex) {
      console.error(`Asset IndexedDB.initialize() => ex ${ex}`);
      return false;
    }
  }

}

// const tx = idb.transaction(objectStoreName);
// const store = tx.db;
// await store.getAll(objectStoreName);

