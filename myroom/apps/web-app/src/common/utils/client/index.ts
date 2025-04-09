import { Scene } from '@babylonjs/core';
import { initializeClientMessage } from '@colorverse/client-message';
import { MyRoomAPI } from 'client-core';
import { logger } from '../logger';

export const messageClient = initializeClientMessage('WebGL', { console: true });


export type SceneType = 'ROOM' | 'AVATAR' | 'ITEM' | 'AVATAR2';
export class SceneManager {
    private static _scene = new Map<SceneType, SceneCore | null>();

    public static get Room() {
        return this._scene.get('ROOM')?.api;
    }

    public static get Avatar() {
        return this._scene.get('AVATAR')?.api;
    }

    public static get Item() {
        return this._scene.get('ITEM')?.api;
    }

    public static getAPI(type: SceneType) {
        return this._scene.get(type)?.api;
    }

    static initializeScene(params: { scene: Scene, type: SceneType, onSuccess?: () => void }) {
        const { scene, type, onSuccess } = params;

        logger.log('SceneManager ', this._scene);
        logger.log('SceneManager ', this._scene.has(type));
        if (!this._scene.has(type)) {
            const api = new MyRoomAPI(scene);
            api.initialize().then(() => {
                logger.log('SceneManager INITIALIZED ');
                this._scene.set(type, new SceneCore(scene, api));
                if (onSuccess) {
                    onSuccess();
                }
            }).catch((e) => {
                logger.log('error', e);
            });
        } else {
            logger.log('SceneManager ALREADY INITIALIZED ');
        }
    }

    static isInit(type: SceneType): boolean {
        return this._scene.get(type) ? true : false;
    }

    static activeScene(type: SceneType) {
        this._scene.get(type)?.active();
    }

    static inactiveScene(type: SceneType) {
        this._scene.get(type)?.inactive();
    }

    static finalize(type: SceneType) {
        logger.log('SceneManager finalize');

        const _inst = this._scene.get(type);
        if (_inst) {
            _inst?.finalize();
            this._scene.delete(type);
        }
    }
}


const RENDER_PERIOD_INACTIVE = 60;
const RENDER_PERIOD_NORMAL = 3;

class SceneCore {
    api: MyRoomAPI;
    scene: Scene;

    constructor(scene: Scene, api: MyRoomAPI) {
        this.scene = scene;
        this.api = api;
    }

    isInit() {
        return this.api !== null;
    }


    /**
     * 렌더링 주기 정상화.
     */
    active() {
        this.api.changeRenderLoop(RENDER_PERIOD_NORMAL);
    }

    /**
     * 렌더링 주기를 늦춘다.
     */
    inactive() {
        this.api.changeRenderLoop(RENDER_PERIOD_INACTIVE);
    }

    finalize() {
        if (this.api) {
            this.api.clearMyRoom();
            this.api.finalize();
        }

        if (this.scene)
            this.scene.dispose();
    }
}