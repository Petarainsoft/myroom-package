import { ipcRenderer, clipboard, app } from 'electron';
import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, InputText, Rectangle, Slider, StackPanel, TextBlock } from '@babylonjs/gui';
import { Constants } from 'client-core/assetSystem/constants';

import path from 'path';

// required imports
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/loaders/glTF";
import { Logger } from './logger';

import { AvatarController, EnvironmentController, IAssetManifest_MyRoom } from 'client-core';
import { TableDataManager } from 'client-core/tableData/tableDataManager';
import { IGenerateIconConfig } from './generateIconConfig';

// required imports
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import { EItemCategory3 } from 'client-core/tableData/defines/System_Enum';
import { IAssetLoader } from 'client-core/assetSystem/definitions';
import { AssetLoader } from 'client-core/assetSystem/loader/assetLoader';
import { MyRoomContext } from 'client-core/assetSystem/myRoomContext';
import { MyRoomController } from 'client-core/assetSystem/controllers/myRoomController';

export class ItemModelIconGenerator {
    public static readonly DEFAULT_ROOM_CAM_ALPHA = 2.341;
    public static readonly DEFAULT_ROOM_CAM_BETA: number = 1.315;
    public static readonly DEFAULT_ROOM_CAM_RADIUS: number = 15;
    public static readonly DEFAULT_ROOM_CAM_TARGET: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
    public static readonly DEFAULT_ITEM_CAM_ALPHA = Math.PI / 2;

    private static _instance: ItemModelIconGenerator;
    private _scene: BABYLON.Scene | null = null;
    private _context: BABYLON.Nullable<MyRoomContext> = null;
    private _assetLoader: IAssetLoader | null = null;

    private _generatingIcons: boolean = false;
    private _ui: AdvancedDynamicTexture | null = null;
    private _rect: Rectangle | null = null;
    private _fovSlider: Slider | null = null;
    private _currentFilePath: string = "";

    private _camera: BABYLON.ArcRotateCamera | null = null;
    private _environmentController: BABYLON.Nullable<EnvironmentController> = null;
    private _iconSize: number = 256;

    get generatingIcons(): boolean {
        return this._generatingIcons;
    }

    public constructor(scene: BABYLON.Scene) {
        ItemModelIconGenerator._instance = this;
        this.init(scene);
    }

    public init(scene: BABYLON.Scene) {
        BABYLON.DracoCompression.DefaultNumWorkers = 0;
        this._scene = scene;

        this._camera = new BABYLON.ArcRotateCamera("camera", ItemModelIconGenerator.DEFAULT_ROOM_CAM_ALPHA, ItemModelIconGenerator.DEFAULT_ROOM_CAM_BETA, ItemModelIconGenerator.DEFAULT_ROOM_CAM_RADIUS, ItemModelIconGenerator.DEFAULT_ROOM_CAM_TARGET, this._scene);
        this._camera.setPosition(new BABYLON.Vector3(0, 5, 15));
        this._camera.attachControl();
        this._camera.wheelDeltaPercentage = 0.003;

        new TableDataManager();

        this._context = new MyRoomContext(this._scene);
        this._context.getCamera()?.dispose();
        this._context.getEnvController()?.dispose();

        this._assetLoader = new AssetLoader(this._context, this._scene);

        this._createUI();

        this._scene.onBeforeRenderObservable.add(() => {
            this._updateIconFrameSize();
        });
    }

    public async generateIcons(filePaths: string[], isFromCommand: boolean): Promise<void> {
        if (!this._scene) {
            return;
        }

        if (!TableDataManager.getInstance().isLoaded()) {
            await TableDataManager.getInstance().loadTableDatas();
        }

        if (this._generatingIcons) {
            return;
        }
        this._generatingIcons = true;

        //기본 환경 설정 파일 올리기..
        if (filePaths.length > 0 && this._environmentController === null) {
            const itemDir = path.dirname(filePaths[0]);
            const itemUpperDir = path.dirname(path.dirname(itemDir));
            const generateIconDataFolder = path.dirname(itemUpperDir) + "\\__ICON_GENERATOR";
            const envSetting = await ipcRenderer.invoke('electron:readJsonFile', path.join(generateIconDataFolder + "\\env", "defalutEnvSetting.json"));

            this._environmentController = new EnvironmentController(this._scene, false, envSetting);
            this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); //아이콘 찍기위해 배경을 투명하게 설정
            Logger.log(`기본 환경 설정 파일을 올렸습니다. path=${path.join(generateIconDataFolder + "\\env", "defalutEnvSetting.json")}`);
        }


        for (let ii = 0; ii < filePaths.length; ++ii) {
            const itemDir = path.dirname(filePaths[ii]);
            const clientItemId = path.basename(itemDir);
            const itemUpperDir = path.dirname(itemDir);
            const generateIconDataFolder = path.dirname(path.dirname(itemUpperDir)) + "\\__ICON_GENERATOR";
            const itemData = TableDataManager.getInstance().findItemByClientID(clientItemId);
            const categoryData = itemData ? TableDataManager.getInstance().findCategory3(itemData.category3.toString()) : undefined;

            Logger.log(`[${ii + 1}/${filePaths.length}] Generating Icon : ${path.basename(filePaths[ii])}`, "\x1b[34m");
            if (null === itemData) {
                Logger.error(`아이템 테이블 데이터를 찿을수 없습니다. : "${clientItemId}"`);
            }

            // Config 파일 읽기
            let configFile = await ipcRenderer.invoke('electron:readJsonFile', path.join(itemDir, "generate-icon-config.json"));
            if (!configFile) {
                if (itemData) {
                    if (categoryData) {
                        const configFilename = `generate-icon-config-${categoryData.Name}.json`;
                        configFile = await ipcRenderer.invoke('electron:readJsonFile', path.join(generateIconDataFolder + "\\category-configs", configFilename));
                        if (!configFile) {
                            console.error(path.join(generateIconDataFolder + "\\category-configs", configFilename));
                            Logger.error(`카테고리 Config 파일이 존재하지 않습니다 : ${configFilename}`);
                        }
                    }
                }
            }
            else {
                Logger.log(`Loaded Config : ${path.basename(itemDir)}\\generate-icon-config.json`);
            }

            let envFile: string = "";
            let cameraSetting = { alpha: ItemModelIconGenerator.DEFAULT_ROOM_CAM_ALPHA, beta: ItemModelIconGenerator.DEFAULT_ROOM_CAM_BETA, radius: undefined, target: undefined, fov: undefined };
            let extraModels: string[] = [];

            if (configFile) {
                if (configFile.ignoreGenerateIcon && configFile.ignoreGenerateIcon === true) {
                    Logger.warn(`"${clientItemId}"는 아이콘 생성이 무시되었습니다.`);
                    return;
                }

                //환경설정 하기
                if (configFile.environmentSetting) {
                    envFile = configFile.environmentSetting;
                }

                //카메라 설정하기
                if (configFile.cameraSettings) {
                    cameraSetting.alpha = configFile.cameraSettings.alpha;
                    cameraSetting.beta = configFile.cameraSettings.beta;
                    if (configFile.cameraSettings.radius) {
                        cameraSetting.radius = configFile.cameraSettings.radius;
                    }

                    if (configFile.cameraSettings.target) {
                        cameraSetting.target = configFile.cameraSettings.target;
                    }

                    if (configFile.cameraSettings.fov) {
                        cameraSetting.fov = configFile.cameraSettings.fov;
                    }
                }

                //extraModel들 읽기
                if (configFile.extraModels) {
                    extraModels = configFile.extraModels;
                }

                //환경설정
                if (configFile.environment) {
                    envFile = configFile.environment;
                }
            }

            this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

            await this._clearScene();
            this._currentFilePath = filePaths[ii];
            const filePath = filePaths[ii];

            let ignoreSnapshot: boolean = false;

            if (path.basename(filePath) === "manifest.json") {
                if (itemData && itemData.category3 === EItemCategory3.AVATERPRESET) {
                    const avatar = new AvatarController("", this._scene, this._assetLoader!, this._context!, null);
                    const manifest = await ipcRenderer.invoke('electron:readJsonFile', filePath);
                    await avatar.loadModelFromManifest(manifest);
                    await new Promise(resolve => setTimeout(resolve, 3000)); //모델이 늦게 올라올수 있다
                }
                else if (itemData && (itemData.category3 === EItemCategory3.INDOORCOORDITEMPLETE || itemData.category3 === EItemCategory3.OUTDOORCOORDITEMPLETE)) {
                    const myroom = new MyRoomController(this._scene, this._assetLoader!, this._context!);
                    const manifest = await ipcRenderer.invoke('electron:readJsonFile', filePath) as IAssetManifest_MyRoom;
                    await myroom.loadModelFromManifest(manifest);
                    await new Promise(resolve => setTimeout(resolve, 5000)); //모델이 늦게 올라올수 있다
                }
                else {
                    ignoreSnapshot = true;
                }
            }
            else {
                //상태 메세지 에니
                if (itemData && itemData.category3 === EItemCategory3.STATUSFEEL) {
                    const avatar = new AvatarController("", this._scene, this._assetLoader!, this._context!, null);
                    const manifest = await ipcRenderer.invoke('electron:readJsonFile', path.join(generateIconDataFolder + "\\avatar-preset", "defaultAvatarPreset.json"));
                    await avatar.loadModelFromManifest(manifest);
                    const assetBuffer = await ipcRenderer.invoke('electron:readModelFile', filePath);
                    const arrayBufferView = new Uint8Array(assetBuffer.byteLength);
                    for (let ii = 0; ii < assetBuffer.length; ++ii) {
                        arrayBufferView[ii] = assetBuffer[ii];
                    }
                    await avatar.getAvatarAnimation().loadAndPlayAnimationFromAssetBuffer(arrayBufferView, path.basename(filePath));
                }
                //아바타 장착물 (Hair ,Eyes, Accesory, Cloth) )
                else if (itemData && (itemData.category3 === EItemCategory3.HAIR || itemData.category3 === EItemCategory3.EYEBALL || itemData.category3 === EItemCategory3.HEADACC || itemData.category3 === EItemCategory3.CLOTHES)) {
                    let skelName = configFile.skeleton ? configFile.skeleton : "face01_withEyes.glb";
                    if (itemData.category3 === EItemCategory3.EYEBALL) {
                        skelName = "face01.glb";
                    }

                    if (skelName !== "") {
                        const avatar = new AvatarController("", this._scene, this._assetLoader!, this._context!, null);
                        //스켈
                        const skelModelAssetBuffer = await ipcRenderer.invoke('electron:readModelFile', path.join(generateIconDataFolder + "\\extra-models", skelName));
                        const skelModelAssetBufferView = new Uint8Array(skelModelAssetBuffer.byteLength);
                        for (let ii = 0; ii < skelModelAssetBuffer.length; ++ii) {
                            skelModelAssetBufferView[ii] = skelModelAssetBuffer[ii];
                        }
                        await avatar.getAvatarSkeleton().loadSkeletonFromAssetBuffer(skelModelAssetBufferView);

                        //animation
                        if (configFile.animation) {
                            const aniName = configFile.animation;
                            const aniModelAssetBuffer = await ipcRenderer.invoke('electron:readModelFile', path.join(generateIconDataFolder + "\\extra-models", aniName));
                            const aniModelAssetBufferView = new Uint8Array(aniModelAssetBuffer.byteLength);
                            for (let ii = 0; ii < aniModelAssetBuffer.length; ++ii) {
                                aniModelAssetBufferView[ii] = aniModelAssetBuffer[ii];
                            }

                            await avatar.getAvatarAnimation().loadAndPlayAnimationFromAssetBuffer(aniModelAssetBufferView, aniName);
                        }



                        //파츠
                        const targetModelAssetBuffer = await ipcRenderer.invoke('electron:readModelFile', filePath);
                        const targetModelAssetBufferView = new Uint8Array(targetModelAssetBuffer.byteLength);
                        for (let ii = 0; ii < targetModelAssetBuffer.length; ++ii) {
                            targetModelAssetBufferView[ii] = targetModelAssetBuffer[ii];
                        }
                        await avatar.getAvatarEquipment().loadEquipmentFromAssetBuffer(targetModelAssetBufferView);

                    }
                    else {
                        // 스켈 없이 바로 올릴경우
                        const assetBuffer = await ipcRenderer.invoke('electron:readModelFile', filePath);
                        await this._appendModel(assetBuffer, path.basename(filePath));
                    }
                }
                else {
                    //모델 파일 올리기
                    const assetBuffer = await ipcRenderer.invoke('electron:readModelFile', filePath);
                    const allPromises = [];
                    allPromises.push(this._appendModel(assetBuffer, path.basename(filePath)));

                    //extraModel들 올리기
                    for (let jj = 0; jj < extraModels.length; ++jj) {
                        const extraModelPath = path.join(generateIconDataFolder + "\\extra-models", extraModels[jj]);
                        const extraModelAssetBuffer = await ipcRenderer.invoke('electron:readModelFile', extraModelPath);
                        allPromises.push(this._appendModel(extraModelAssetBuffer, path.basename(extraModelPath)));
                    }

                    await Promise.all(allPromises);

                }
            }


            //Camera 설정
            this._applyCameraSetting(cameraSetting);
            //this._rect!.isVisible = false;
            //this._ui!.removeControl(this._rect!);
            await new Promise(resolve => setTimeout(resolve, 100));

            //스샷 찍기
            if (!ignoreSnapshot) {
                this._takeScreenshot(filePath);
            }
            else {
                Logger.warn(`"${clientItemId}"는 아이콘 생성이 무시되었습니다.`);
                if (isFromCommand) {
                    const exitcode = ignoreSnapshot ? Constants.ICON_GENERATOR_EXIT_CODE_SKIP : 0;
                    ipcRenderer.invoke('electron:exit', exitcode);
                }
            }

            //this._rect!.isVisible = true;
            //this._ui!.addControl(this._rect!);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        this._generatingIcons = false;

        if (isFromCommand) {
            //ipcRenderer.invoke('electron:quit');
            ipcRenderer.invoke('electron:exit', 0);
        }
    }

    public copyClipboardCameraSetting() {
        if (this._camera === null) {
            return;
        }

        Logger.log("카메라 설정이 클립보드에 복사되었습니다.");
        clipboard.writeText(`"cameraSettings": {
            "alpha": ${this._camera.alpha},
            "beta": ${this._camera.beta},
            "radius": ${this._camera.radius},
            "target": [${this._camera.target.x}, ${this._camera.target.y}, ${this._camera.target.z}],
            "fov": ${BABYLON.Tools.ToDegrees(this._camera.fov)}
        }`);
    }

    public createGenerateIconConfigFile(filePath: string) {
        if (this._camera === null) {
            return;
        }

        const data: IGenerateIconConfig = {
            "cameraSettings": {
                "alpha": this._camera.alpha,
                "beta": this._camera.beta,
                "radius": this._camera.radius,
                "target": [this._camera.target.x, this._camera.target.y, this._camera.target.z],
                "fov": BABYLON.Tools.ToDegrees(this._camera.fov)
            },
            "extraModles": []
        };
        ipcRenderer.invoke('electron:saveConfigFile', path.dirname(filePath), JSON.stringify(data));
    }

    public getCurrentCameraSetting(): { alpha: number, beta: number, radius: number, target: number[], fov: number; } {
        if (this._camera === null) {
            return { alpha: 0, beta: 0, radius: 0, target: [0, 0, 0], fov: 0 };
        }

        return { alpha: this._camera.alpha, beta: this._camera.beta, radius: this._camera.radius, target: [this._camera.target.x, this._camera.target.y, this._camera.target.z], fov: BABYLON.Tools.ToDegrees(this._camera.fov) };
    }

    public updateIconSetting(cameraSetting: { alpha: number, beta: number, radius: number, target: number[], fov: number; }, iconSize: number) {
        this._applyCameraSetting(cameraSetting);
        this._iconSize = iconSize;
    }

    public takeScreenshotFromUI() {
        if (this._currentFilePath !== "") {
            this._takeScreenshot(this._currentFilePath);
        }
    }

    public openIconFolder() {
        if (this._currentFilePath !== "") {
            const dir = path.dirname(this._currentFilePath);
            ipcRenderer.invoke('electron:openFolder', dir);
        }
    }

    public toggleDebugLayer() {
        if (this._scene) {
            this._scene.debugLayer.isVisible() ? this._scene.debugLayer.hide() : this._scene.debugLayer.show();
        }
    }


    private _takeScreenshot(filePath: string): void {
        if (!this._scene || !this._camera) {
            return;
        }


        //
        // canvas 싸이즈를 조절후 스샷을 찍고 다시 복원 하는 방법을 사용한다.
        // https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG 참조
        //
        const engine = this._scene.getEngine();
        const canvas = this._scene.getEngine().getRenderingCanvas();
        const canvasW = engine.getRenderWidth();
        const canvasH = engine.getRenderHeight();

        canvas!.style.width = 1024 + "px";
        canvas!.style.height = 1024 + "px";
        this._scene.getEngine().resize(true);

        this._rect!.isVisible = false;

        BABYLON.Tools.CreateScreenshot(this._scene.getEngine(), this._camera, { width: 1024, height: 1024, finalWidth: 1024, finalHeight: 1024, precision: 1 }, (base64Data) => {
            const base64DataToArrayBuffer = (base64Data: string) => {
                const arr = base64Data.split(',');
                if (!arr) {
                    return;
                }

                const mimeArr = arr[0].match(/:(.*?);/);
                if (!mimeArr) {
                    return;
                }


                const mime = mimeArr[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);

                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }

                return u8arr;
            };

            ipcRenderer.invoke('electron:saveIconFile', path.dirname(filePath), base64DataToArrayBuffer(base64Data), this._iconSize);

            this._rect!.isVisible = true;
            canvas!.style.width = canvasW + "px";
            canvas!.style.height = canvasH + "px";
            engine.resize(true);


        });


        // this._scene.render();

        // BABYLON.Tools.CreateScreenshotUsingRenderTarget(this._scene.getEngine(), this._scene.activeCamera!, { width: 1024, height: 1024, finalWidth: 1024, finalHeight: 1024, precision: 1 }, (base64Data) => {
        //     const base64DataToArrayBuffer = (base64Data: string) => {
        //         const arr = base64Data.split(',');
        //         if (!arr) {
        //             return;
        //         }

        //         const mimeArr = arr[0].match(/:(.*?);/);
        //         if (!mimeArr) {
        //             return;
        //         }


        //         const mime = mimeArr[1];
        //         const bstr = atob(arr[1]);
        //         let n = bstr.length;
        //         const u8arr = new Uint8Array(n);

        //         while (n--) {
        //             u8arr[n] = bstr.charCodeAt(n);
        //         }

        //         return u8arr;
        //     };

        //     ipcRenderer.invoke('electron:saveIconFile', path.dirname(filePath), base64DataToArrayBuffer(base64Data), this._iconSize);
        // }, undefined, 4, true);

    }

    private async _appendModel(assetBuffer: Buffer, name: string): Promise<void> {
        const view = new Uint8Array(assetBuffer.byteLength);
        for (let ii = 0; ii < assetBuffer.length; ++ii) {
            view[ii] = assetBuffer[ii];
        }

        const file = new File([view], name, { type: "application/octet-stream" });
        await BABYLON.SceneLoader.ImportMeshAsync("", "", file, this._scene, undefined, ".glb", name);
    }

    private async _clearScene() {
        if (!this._scene) {
            return;
        }

        this._scene.materials.forEach((m) => {
            m.dispose();
        });

        this._scene.skeletons.forEach((s) => {
            s.dispose();
        });

        this._scene.meshes.forEach((m) => {
            m.dispose(false, true);
        });

        this._scene.transformNodes.forEach((t) => {
            if (!(t instanceof EnvironmentController)) {
                t.dispose(false, true);
            }

            //t.dispose(false, true);
        });

        await this._assetLoader!.clearCache();

    }

    private _fitCameraToObject() {
        if (!this._scene || !this._camera) {
            return;
        }

        const bound = this._getSceneBoundingInfo();
        this._camera.setTarget(bound.boundingSphere.centerWorld);
        let radius = bound.boundingSphere.radiusWorld;
        let aspectRatio = this._scene.getEngine().getAspectRatio(this._camera!);
        let halfMinFov = this._camera!.fov / 2;
        if (aspectRatio < 1) {
            halfMinFov = Math.atan(aspectRatio * Math.tan(this._camera!.fov / 2));
        }

        let viewRadius = Math.abs(radius / Math.sin(halfMinFov));
        this._camera!.alpha = ItemModelIconGenerator.DEFAULT_ITEM_CAM_ALPHA;
        this._camera!.beta = ItemModelIconGenerator.DEFAULT_ROOM_CAM_BETA;
        this._camera!.radius = viewRadius;
        // this._camera!.lowerRadiusLimit = Math.max(1.5, viewRadius);
        // this._camera!.upperRadiusLimit = Math.max(5, viewRadius * 2);
        this._camera!.useBouncingBehavior = false;
        this._camera!.minZ = 0.1;

        this._camera.lowerBetaLimit = null;
        this._camera.upperBetaLimit = null;
        this._camera.lowerAlphaLimit = null;
        this._camera.upperAlphaLimit = null;
    }

    private _getSceneBoundingInfo(): BABYLON.BoundingInfo {
        const boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-0.01, -0.01, -0.01), new BABYLON.Vector3(0.01, 0.01, 0.01));
        if (!this._scene || !this._camera) {
            return boundingInfo;
        }

        this._scene.meshes.forEach((m) => {
            boundingInfo.encapsulateBoundingInfo(m.getBoundingInfo());
        });

        return boundingInfo;
    }

    private _applyCameraSetting(cameraSetting: { alpha: number, beta: number, radius?: number, target?: number[], fov?: number; }) {

        if (!this._scene || !this._camera) {
            return;
        }

        if (cameraSetting.fov !== undefined) {
            this._camera.fov = BABYLON.Tools.ToRadians(cameraSetting.fov);
            if (this._fovSlider) {
                this._fovSlider.value = this._camera.fov;
            }
        }
        else {
            this._camera.fov = 0.8;
            if (this._fovSlider) {
                this._fovSlider.value = 0.8;
            }
        }

        if (cameraSetting.target) {
            this._camera.setTarget(BABYLON.Vector3.FromArray(cameraSetting.target));
        }
        else {
            this._camera.setTarget(new BABYLON.Vector3(0, 0, 0));
        }

        if (cameraSetting.radius) {
            this._camera.radius = cameraSetting.radius;
        }
        else {
            this._fitCameraToObject();
        }

        this._camera.alpha = cameraSetting.alpha;
        this._camera.beta = cameraSetting.beta;
    }

    private _createUI() {


        if (!this._scene || !this._camera) {
            return;
        }

        this._ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        //frame
        this._rect = new Rectangle();
        const canvasW = this._scene.getEngine().getRenderingCanvas()!.clientWidth;
        const canvasH = this._scene.getEngine().getRenderingCanvas()!.clientHeight;
        const minSize = Math.min(canvasW, canvasH);
        this._rect.height = `${minSize}px`;
        this._rect.width = `${minSize}px`;
        this._rect.thickness = 1;
        this._rect.background = "#00000000";
        this._ui.addControl(this._rect);

        // const panel = new StackPanel();
        // panel.width = "220px";
        // panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        // panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        // this._ui.addControl(panel);

        // var header = new TextBlock();
        // header.text = `fov: 45 deg`;
        // header.height = "30px";
        // header.color = "white";
        // panel.addControl(header);

        // this._fovSlider = new Slider();
        // this._fovSlider.minimum = 0;
        // this._fovSlider.maximum = 0.5 * Math.PI;
        // this._fovSlider.value = 0.8;
        // this._fovSlider.isVertical = false;
        // this._fovSlider.height = "20px";
        // this._fovSlider.width = "200px";
        // this._fovSlider.onValueChangedObservable.add((value) => {
        //     header.text = "fov: " + (BABYLON.Tools.ToDegrees(value) | 0) + " deg";
        //     this._camera!.fov = value;
        // });
        // panel.addControl(this._fovSlider);


        // //alpha
        // var inputBeta = new InputText();
        // inputBeta.width = "150px";
        // inputBeta.height = "40px";
        // inputBeta.text = this._camera.alpha.toString();
        // inputBeta.onTextChangedObservable.add(() => {
        //     this._camera!.alpha = parseFloat(inputBeta.text);
        // });
        // panel.addControl(inputBeta);

        // //beta
        // var inputBeta = new InputText();
        // inputBeta.width = "150px";
        // inputBeta.height = "40px";
        // inputBeta.text = this._camera.alpha.toString();
        // inputBeta.onTextChangedObservable.add(() => {
        //     this._camera!.alpha = parseFloat(inputBeta.text);
        // });
        // panel.addControl(inputBeta);


        // var button = Button.CreateSimpleButton("but1", "아이콘 찍기");
        // button.paddingTop = "10px";
        // button.width = "150px";
        // button.height = "40px";
        // button.color = "white";
        // button.cornerRadius = 20;
        // button.background = "green";
        // button.onPointerUpObservable.add(() => {
        //     if (this._currentFilePath !== "") {
        //         this._takeScreenshot(this._currentFilePath);
        //     }
        // });
        // button.textBlock!.fontSize = 10;
        // panel.addControl(button);

        // var button2 = Button.CreateSimpleButton("but1", "카메라 설정 복사");
        // button2.paddingTop = "10px";
        // button2.width = "150px";
        // button2.height = "40px";
        // button2.color = "white";
        // button2.cornerRadius = 20;
        // button2.background = "blue";
        // button2.onPointerUpObservable.add(() => {
        //     this.copyClipboardCameraSetting();
        // });
        // button2.textBlock!.fontSize = 10;
        // panel.addControl(button2);

        // var button3 = Button.CreateSimpleButton("but1", "설정파일 만들기");
        // button3.paddingTop = "10px";
        // button3.width = "150px";
        // button3.height = "40px";
        // button3.color = "white";
        // button3.cornerRadius = 20;
        // button3.background = "blue";
        // button3.onPointerUpObservable.add(() => {
        //     this.createGenerateIconConfigFile(this._currentFilePath);
        // });
        // button3.textBlock!.fontSize = 10;

        // panel.addControl(button3);

    }

    private _updateIconFrameSize() {
        if (!this._scene || !this._camera) {
            return;
        }

        const canvasW = this._scene.getEngine().getRenderingCanvas()!.clientWidth;
        const canvasH = this._scene.getEngine().getRenderingCanvas()!.clientHeight;
        const minSize = Math.min(canvasW, canvasH);

        if (this._rect!.width === minSize && this._rect!.height === minSize) {
            return;
        }

        this._rect!.height = `${minSize}px`;
        this._rect!.width = `${minSize}px`;
    }

    public static getInstance(): ItemModelIconGenerator {
        return this._instance;
    }
}