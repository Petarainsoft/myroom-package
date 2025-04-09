import { MyRoomAPI } from 'client-core';
import { SceneManagerTemplate } from './manager';
import { Scene } from '@babylonjs/core/';
import { logger } from '../utils/logger';
import React from 'react';

type TInitCallback = () => void;

const RENDER_PERIOD_INACTIVE = 60;
const RENDER_PERIOD_NORMAL = 3;

export class RoomManager extends SceneManagerTemplate {

  static initializeScene(scene: Scene) {
    if (!this._myRoomAPI) {
      this._myRoomAPI = new MyRoomAPI(scene);
      this._myRoomAPI.initialize();
      this._scene = scene;
      this._onInitCallback.forEach(callback => callback());

    } else {
      logger.log('RoomManager 5 ALREADY INITIALIZED ');
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
    } else {
      this._onInitCallback.push(callback);
    }
  }

  static onExit() {
    if (this._scene !== null && this._myRoomAPI !== null) {
      this._scene.dispose();
      this._myRoomAPI.clearMyRoom();
      this._myRoomAPI.finalize();
      this._myRoomAPI = null;
    } else {
      logger.log('RoomManager _scene is null ');
    }
  }

  static useOptimizeRenderRoom() {
    React.useEffect(() => {
      logger.log('changeRenderLoop 1')
      // back에 있는 room scene을 fps 낮춘다.
      RoomManager.getAPI.changeRenderLoop(RENDER_PERIOD_INACTIVE);
      return () => {
        RoomManager.getAPI.changeRenderLoop(RENDER_PERIOD_NORMAL);
      };
    }, []);
  }
}
