import { MyRoomAPI } from 'client-core';
import { SceneManagerTemplate } from './manager';
import { Scene } from '@babylonjs/core/';
import { logger } from '../utils/logger';

type TInitCallback = () => void;
export class AvatarManager extends SceneManagerTemplate {

  static initializeScene(scene: Scene) {
    if (!this._myRoomAPI) {
      this._myRoomAPI = new MyRoomAPI(scene);
      this._myRoomAPI.initialize();
      this._scene = scene;
      this._onInitCallback.forEach(callback => callback());

    } else {
      logger.log('Static 5 ALREADY INITIALIZED ');
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
      callback()
    }
    else {
      this._onInitCallback.push(callback);
    }
  }

  static onExit() {
    if (this._scene !== null && this._myRoomAPI !== null) {
      this._scene.dispose();
      this._myRoomAPI.clearAvatar();
      this._myRoomAPI.finalize();
      this._myRoomAPI = null;
    } else {
      logger.log('static _scene is null ');
    }
  }
}

//  현재 myroom client 코드를 보면, MyRoomAPI를 사용할때 다음과 같이 사용해야 합니다.
// avatar용으로 사용시 다 쓰고 나서,
// MyRoom.clearAvatar()
// MyRoom.finalize()
// item용으로 사용시 다 쓰고 나서,
// MyRoom.clearItem()
// MyRoom.finalize()
// room용으로 사용시 다 쓰고 나서,
// MyRoom.clearRoom()
// MyRoom.finalize()

// -> 더해서 onSceneRender 안에서 scene.dispose() 필요