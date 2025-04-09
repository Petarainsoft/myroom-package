import { MyRoomAPI } from 'client-core';
import { SceneManagerTemplate } from './manager';
import { Scene } from '@babylonjs/core/';
import { logger } from '../utils/logger';

type TInitCallback = () => void;
export class ItemManager extends SceneManagerTemplate {

  static initializeScene(scene: Scene) {
    if (!this._myRoomAPI) {
      this._myRoomAPI = new MyRoomAPI(scene);
      this._myRoomAPI.initialize();
      this._scene = scene;
      this._onInitCallback.forEach(callback => callback());

    } else {
      logger.log('ItemManager 5 ALREADY INITIALIZED ');
    }
  }

  static get getAPI() {
    if (!this._myRoomAPI) {
      throw new Error("_myRoomAPI is not initialized yet.");
    }
    return this._myRoomAPI;
  }

  static isInit() {
    return this._myRoomAPI !== null;
  }

  static onInit(callback: TInitCallback) {
    if (this.isInit()) {
      callback();
    }
    else {
      this._onInitCallback.push(callback);
    }
  }

  static onExit() {
    if (this._scene !== null && this._myRoomAPI !== null) {
      this._scene.dispose();
      this._myRoomAPI.clearItem();
      this._myRoomAPI.finalize();
      this._myRoomAPI = null;
      // TODO: 윤준하님 callback 초기화 시켜줬습니다. 맞는지 확인부탁드립니다.
      this._onInitCallback = [];
    } else {
      logger.log('ItemManager _scene is null ');
    }
  }
}

