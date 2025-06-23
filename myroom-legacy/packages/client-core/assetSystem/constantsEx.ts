import { Scene, EngineOptions, DracoCompression, KhronosTextureContainer2 } from '@babylonjs/core';
import { ClientConfiguration } from '../clientConfiguration';

const RENDER_PERIOD_INACTIVE = 60;
const RENDER_PERIOD_NORMAL = 3;

export class ConstantsEx {
    public static readonly CANVAS_ID = "renderCanvas";

    // service type (이부분은 우선 임시로 처리 차후에 시스템적으로 넣어야 함.)
    public static readonly SERVICE_JOYSAM = "joysam";
    public static readonly SERVICE_KH = "KakaoHealthcare";

    private static readonly DEVICE_RATIO = 1.5;


    private static _initialized = false;
    private static USE_30_FPS = true;
    private static _idleRoutine: (() => void) | null = null;

    private static _initialize() {
        if (this._initialized) return;

        this._initialized = true;
        // touchpad가 있는 경우 (대부분 모바일) 에는 30 fps로 최적화
        // 브라우져가 실행된 다음에 해야 된다..(가끔 이상한 값이 나오기 때문)
        this.USE_30_FPS = this.isMobile();
        ClientConfiguration.initialize();
    }

    public static isMobile(): boolean {
        return (navigator.maxTouchPoints > 0 || 'ontouchstart' in document.documentElement);
    }

    public static isIOS(): boolean {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
      }

    public static setDracoConfig(url: string) {
        console.warn("setDracoConfig", url);
        DracoCompression.Configuration = {
            decoder: {
                wasmUrl: url + "/draco_wasm_wrapper_gltf.js",
                wasmBinaryUrl: url + "/draco_decoder_gltf.wasm",
                fallbackUrl: url + "/draco_decoder_gltf.js",
            }
        };

        KhronosTextureContainer2.URLConfig.jsDecoderModule = url + "/babylon.ktx2Decoder.js";
    }

    public static changeRenderLoop(scene: Scene, renderPeriod: number) {
        if (!this.USE_30_FPS) return;

        setTimeout(() => {
            if (scene) {
                const arr = scene.getEngine().activeRenderLoops;
                arr.splice(0, arr.length);

                console.log("changeRenderLoop", renderPeriod);

                let count = 0;
                scene.getEngine().runRenderLoop(function () {
                    count++;
                    if (count % renderPeriod !== 0) {
                        ConstantsEx._idleRoutine?.();
                        return;
                    }
                    scene?.render();
                });
            }
        }, 1);
    }
    public static setIdleUpdateRoutine(scene: Scene | null, routine: () => void, set: boolean) {
        if (this.USE_30_FPS) {
            ConstantsEx._idleRoutine = set ? routine : null;
        } else {
            if (routine) scene?.registerBeforeRender(routine);
            else scene?.unregisterBeforeRender(routine);
        }
    }
    public static getAntialias(): boolean {
        this._initialize();
        return !this.USE_30_FPS;
    }
    public static getEngineOption(): EngineOptions {
        this._initialize();
        return {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false,
            limitDeviceRatio: this.USE_30_FPS ? this.DEVICE_RATIO : undefined,
        }
    }
    public static getAdaptToDeviceRatio(): boolean {
        this._initialize();
        return this.USE_30_FPS;
    }
    public static setScreenScale(scene: Scene) {
        //if (!ConstantsEx.isMobile())
        this._initialize();
        scene.getEngine().setHardwareScalingLevel(ClientConfiguration.hardwareScalingLevel);
    }


}