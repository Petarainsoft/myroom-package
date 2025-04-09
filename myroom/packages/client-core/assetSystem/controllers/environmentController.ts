import * as BABYLON from "@babylonjs/core";
import { Constants } from "../constants";

// ts
import defaultEnvironmentCubeMap from "../../assets/environment/environment.env";
import defaultEvnSetting from "../../assets/environment/defalutEnvSetting.json";

import { IAssetManifest_Environment as IAssetManifest_Environment } from "../jsonTypes/manifest/assetManifest_Environment";
import { ConstantsEx } from "../constantsEx";
import { ClientConfiguration, ShadowType } from '../../clientConfiguration';

class MyShadowGenerator extends BABYLON.ShadowGenerator {
    public setDarkness(darkness: number): BABYLON.ShadowGenerator {
        this._darkness = darkness;
        return this;
    }
}

/**
 * 환경설정의 저장및 로드 기능
 * Inspector를 통해 설정 Custom Inspector UI 제공
 * https://doc.babylonjs.com/toolsAndResources/inspector#extensibility 참고
 */
export class EnvironmentController extends BABYLON.TransformNode {

    private _hemiLight: BABYLON.Nullable<BABYLON.HemisphericLight> = null;
    private _sunLight: BABYLON.Nullable<BABYLON.DirectionalLight> = null;
    private _defaultPipeline: BABYLON.Nullable<BABYLON.DefaultRenderingPipeline> = null;
    private _ssaoPipeline: BABYLON.Nullable<BABYLON.SSAORenderingPipeline> = null;
    private _shadowGenertor: BABYLON.Nullable<BABYLON.ShadowGenerator> = null;
    private _lastLoadedEnvCubemapBase64: string = "";
    private _createdTextureList: BABYLON.BaseTexture[] = [];
    private _glowMeshMap: Map<number, BABYLON.Mesh> = new Map<number, BABYLON.Mesh>();

    public getShadowGenerator(): BABYLON.Nullable<BABYLON.ShadowGenerator> {
        return this._shadowGenertor;
    }

    public constructor(scene?: BABYLON.Nullable<BABYLON.Scene>, forSetup: boolean = false, envSettings: BABYLON.Nullable<IAssetManifest_Environment> = null,) {
        super("환경설정", scene);

        if (false === this.applyEnvironmentSetting(envSettings)) {
            console.error("EnvironmentController._initializeEnvironment() : failed!!");
            return;
        }

        if (forSetup) {
            this.inspectableCustomProperties = [];
            this._createCustomProperties();
        }

        this.onDispose = () => { this.finalize(); };
    }

    public finalize() {
        this._scene.imageProcessingConfiguration.colorGradingEnabled = false;

        this._clearCreatedAssets();

        if (null !== this._shadowGenertor) {
            this._shadowGenertor.dispose();
            this._shadowGenertor = null;
        }

        if (null !== this._skyboxMesh) {
            this._skyboxMesh.dispose();
            this._skyboxMesh = null;
        }

        if (null !== this._skyboxMtl) {
            this._skyboxMtl.dispose();
            this._skyboxMtl = null;
        }

        if (null !== this._hemiLight) {
            this._hemiLight.dispose();
            this._hemiLight = null;
        }

        if (null !== this._sunLight) {
            this._sunLight.dispose();
            this._sunLight = null;
        }

        if (null != this._defaultPipeline) {
            this._defaultPipeline.dispose();
            this._defaultPipeline = null;
        }

        if (null != this._ssaoPipeline) {
            this._scene.postProcessRenderPipelineManager.removePipeline(this._ssaoPipeline.name);
            this._ssaoPipeline.dispose();
            this._ssaoPipeline = null;
        }

        this._glowMeshMap.clear();
    }

    private _clearCreatedAssets() {
        this._createdTextureList.forEach(texture => {
            texture.dispose();
        });
        this._createdTextureList = [];
    }

    public showSkybox(bShow: boolean) {
        if (this._skyboxMesh) {
            this._skyboxMesh.setEnabled(bShow);
        }
    }

    public addShadowCastMeshes(meshes: BABYLON.AbstractMesh[]) {
        if (this._shadowGenertor) {
            meshes.forEach((m) => {
                this._shadowGenertor!.addShadowCaster(m);
                m.receiveShadows = true;

                if (m instanceof BABYLON.Mesh
                    && m.material instanceof BABYLON.PBRMaterial && m.material.emissiveTexture) {
                    this._glowMeshMap.set(m.uniqueId, m);
                }
            });
        }
    }

    public removeShadowCastMeshes(meshes: BABYLON.AbstractMesh[]) {
        if (this._shadowGenertor) {
            meshes.forEach((m) => {
                this._shadowGenertor!.removeShadowCaster(m);
                m.receiveShadows = false;

                if (m instanceof BABYLON.Mesh
                    && m.material instanceof BABYLON.PBRMaterial && m.material.emissiveTexture) {
                    this._glowMeshMap.delete(m.uniqueId);
                }
            });
        }
    }

    public applyOnlyIncludeGlowMeshes(apply: boolean) {
        if (!this._defaultPipeline?.glowLayer) return;

        if (apply) {
            this._glowMeshMap.forEach((m) => {
                this._defaultPipeline!.glowLayer!.addIncludedOnlyMesh(m);
            });
        } else {
            this._glowMeshMap.forEach((m) => {
                this._defaultPipeline!.glowLayer!.removeIncludedOnlyMesh(m);
            });
        }
    }

    //-----------------------------------------------------------------------------------
    // applyEnviromentSetting
    //-----------------------------------------------------------------------------------
    public applyEnvironmentSetting(settings: BABYLON.Nullable<IAssetManifest_Environment> = null, dontCreateSkyBox: boolean = false): boolean {
        let envSetting: IAssetManifest_Environment = settings ? settings : defaultEvnSetting;
        return this._applyEnvironmentSetting(envSetting, dontCreateSkyBox);
    }

    private _applyEnvironmentSetting(envSetting: IAssetManifest_Environment, dontCreateSkyBox: boolean = false): boolean {

        this.finalize();

        this._lastLoadedEnvCubemapBase64 = "";

        let cubeTexture: BABYLON.Nullable<BABYLON.CubeTexture> = null;

        if ("" !== envSetting.main.skybox.envMapBase64) {
            this._lastLoadedEnvCubemapBase64 = envSetting.main.skybox.envMapBase64;

            const array = BABYLON.StringTools.DecodeBase64ToBinary(this._lastLoadedEnvCubemapBase64.split(',')[1]);
            const blobUrl = URL.createObjectURL(new Blob([array]));
            cubeTexture = new BABYLON.CubeTexture(blobUrl, this._scene, null, false, null, null, null, BABYLON.Constants.TEXTUREFORMAT_RGBA, false, '.env');
            URL.revokeObjectURL(blobUrl);
        }
        else {
            cubeTexture = new BABYLON.CubeTexture(defaultEnvironmentCubeMap, this._scene);
        }
        this._createdTextureList.push(cubeTexture);

        //skybox
        if (dontCreateSkyBox === false) {
            this._skyboxMesh = this._scene.createDefaultSkybox(cubeTexture, true, 1000, envSetting.main.skybox.blur, true);
            this._skyboxMtl = this._skyboxMesh!.material as BABYLON.PBRMaterial;
            this._skyboxBlur = envSetting.main.skybox.blur;
            this._skyboxRotAngle = envSetting.main.skybox.rotAngle;
            // reflectionTexture는 createDefaultSkybox 안에서 clone되어 생성되었으므로, 나중에 해제해야 한다. ㅜㅜ (이부분은 babylon code에 따라 변동가능 쩝.)
            if (this._skyboxMtl.reflectionTexture) this._createdTextureList.push(this._skyboxMtl.reflectionTexture);
        }

        //hemi spheric light
        if (envSetting.main.hemiSphericLight) {
            this._hemiLight = new BABYLON.HemisphericLight(Constants.HEMI_SPHERIC_LIGHT_NAME, BABYLON.Vector3.FromArray(envSetting.main.hemiSphericLight.dir), this._scene);
            this._hemiLight.intensity = envSetting.main.hemiSphericLight.intensity;
            this._hemiLight.diffuse = BABYLON.Color3.FromArray(envSetting.main.hemiSphericLight.skyColor);
            this._hemiLight.groundColor = BABYLON.Color3.FromArray(envSetting.main.hemiSphericLight.groundColor);
        }

        //sun
        if (envSetting.main.sun) {
            this._sunLight = new BABYLON.DirectionalLight(Constants.DIRECTIONAL_LIGHT_NAME, BABYLON.Vector3.FromArray(envSetting.main.sun.dir), this._scene);
            this._sunLight.intensity = envSetting.main.sun.intensity;
            this._sunLight.diffuse = BABYLON.Color3.FromArray(envSetting.main.sun.color);
            this._sunLight.specular = BABYLON.Color3.FromArray(envSetting.main.sun.specColor);
            if (envSetting.main.sun.pos) {
                this._sunLight.position = BABYLON.Vector3.FromArray(envSetting.main.sun.pos);
            }

            if (null !== this._shadowGenertor) {
                this._shadowGenertor.dispose();
            }

            if (ClientConfiguration.shadowType === ShadowType.NONE) {
                // none
            } else {
                this._shadowGenertor = new MyShadowGenerator(ClientConfiguration.shadowSize, this._sunLight);
                this._shadowGenertor.bias = 0.00025;
                // 그림자를 좀더 어둡게 표현하기 위해서
                this._shadowGenertor.darkness = -1;

                if (ClientConfiguration.shadowType === ShadowType.PCF) {
                    this._shadowGenertor.usePercentageCloserFiltering = true;
                    this._shadowGenertor.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
                } else if (ClientConfiguration.shadowType === ShadowType.CONTACT_HARDENING) {
                    this._shadowGenertor.useContactHardeningShadow = true;
                    this._shadowGenertor.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
                    this._shadowGenertor.contactHardeningLightSizeUVRatio = 0.22;
                }
            }
        }

        //ColorCorrection
        if (ClientConfiguration.usePostProcess && envSetting.main.colorCorrection) {
            const colorCorrection = envSetting.main.colorCorrection;
            this._scene.imageProcessingConfiguration.colorGradingEnabled = colorCorrection.enabled;
            if (envSetting.main.colorCorrection.lutTexBase64) {
                const colorGrading = BABYLON.Texture.CreateFromBase64String(colorCorrection.lutTexBase64, colorCorrection.lutTexName, this._scene, true, false);
                if (colorGrading) {
                    colorGrading.anisotropicFilteringLevel = 1;
                    colorGrading.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    colorGrading.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                }
                else {
                    this._scene.imageProcessingConfiguration.colorGradingEnabled = false;
                }

                this._scene.imageProcessingConfiguration.colorGradingTexture = colorGrading;
                this._scene.imageProcessingConfiguration.colorGradingTexture!.level = envSetting.main.colorCorrection.level;
                this._scene.imageProcessingConfiguration.colorGradingWithGreenDepth = false;

                this._createdTextureList.push(colorGrading);
            }
        }
        else {
            this._scene.imageProcessingConfiguration.colorGradingEnabled = false;
        }

        const cameras = [this._scene.activeCamera!];
        //postprocess
        if (ClientConfiguration.usePostProcess && envSetting.main.postprocess) {
            this._defaultPipeline = new BABYLON.DefaultRenderingPipeline("default", true, this._scene, cameras);
            // 최적화를 위해서 (ulralra)
            this._defaultPipeline.automaticBuild = false;

            //bloom
            this._defaultPipeline.bloomEnabled = envSetting.main.postprocess.bloom.enabled;
            this._defaultPipeline.bloomThreshold = envSetting.main.postprocess.bloom.threshold;
            this._defaultPipeline.bloomWeight = envSetting.main.postprocess.bloom.weight;
            this._defaultPipeline.bloomKernel = envSetting.main.postprocess.bloom.kernel;
            this._defaultPipeline.bloomScale = envSetting.main.postprocess.bloom.scale;

            //chromaticAberration
            this._defaultPipeline.chromaticAberrationEnabled = envSetting.main.postprocess.chromaticAberration.enabled;
            this._defaultPipeline.chromaticAberration.aberrationAmount = envSetting.main.postprocess.chromaticAberration.aberrationAmount;
            this._defaultPipeline.chromaticAberration.radialIntensity = envSetting.main.postprocess.chromaticAberration.radialIntensity;
            this._defaultPipeline.chromaticAberration.centerPosition = BABYLON.Vector2.FromArray(envSetting.main.postprocess.chromaticAberration.center);
            this._defaultPipeline.chromaticAberration.direction = BABYLON.Vector2.FromArray(envSetting.main.postprocess.chromaticAberration.direction);

            //DOF
            this._defaultPipeline.depthOfFieldEnabled = envSetting.main.postprocess.DOF.enabled;
            this._defaultPipeline.depthOfField.focalLength = envSetting.main.postprocess.DOF.focalLength;
            this._defaultPipeline.depthOfField.fStop = envSetting.main.postprocess.DOF.fStop;
            this._defaultPipeline.depthOfField.focusDistance = envSetting.main.postprocess.DOF.distance;
            this._defaultPipeline.depthOfField.lensSize = envSetting.main.postprocess.DOF.lensSize;
            this._defaultPipeline.depthOfFieldBlurLevel = envSetting.main.postprocess.DOF.blurLevel;

            //FXAA
            this._defaultPipeline.fxaaEnabled = envSetting.main.postprocess.FXAA.enabled;
            if (!this._defaultPipeline.fxaaEnabled) {
                this._defaultPipeline.samples = 4;
            }

            //glowLayer
            this._defaultPipeline.glowLayerEnabled = envSetting.main.postprocess.glowLayer.enabled;
            if (this._defaultPipeline.glowLayer) {
                this._defaultPipeline.glowLayer.blurKernelSize = envSetting.main.postprocess.glowLayer.blurKernelSize;
                this._defaultPipeline.glowLayer.intensity = envSetting.main.postprocess.glowLayer.intensity;
            }

            //grain
            this._defaultPipeline.grainEnabled = envSetting.main.postprocess.grain.enabled;
            this._defaultPipeline.grain.animated = envSetting.main.postprocess.grain.animated;
            this._defaultPipeline.grain.intensity = envSetting.main.postprocess.grain.intensity;

            //imageProcessing
            this._defaultPipeline.imageProcessingEnabled = envSetting.main.postprocess.imageProcessing.enabled;
            this._defaultPipeline.imageProcessing.contrast = envSetting.main.postprocess.imageProcessing.contrast;
            this._defaultPipeline.imageProcessing.exposure = envSetting.main.postprocess.imageProcessing.exposure;

            this._defaultPipeline.imageProcessing.toneMappingEnabled = envSetting.main.postprocess.imageProcessing.toneMapping.enabled;
            this._defaultPipeline.imageProcessing.toneMappingType = envSetting.main.postprocess.imageProcessing.toneMapping.type;

            this._defaultPipeline.imageProcessing.vignetteEnabled = envSetting.main.postprocess.imageProcessing.vignette.enabled;
            this._defaultPipeline.imageProcessing.vignetteWeight = envSetting.main.postprocess.imageProcessing.vignette.weight;
            this._defaultPipeline.imageProcessing.vignetteStretch = envSetting.main.postprocess.imageProcessing.vignette.stretch;
            this._defaultPipeline.imageProcessing.vignetteCameraFov = envSetting.main.postprocess.imageProcessing.vignette.fov;
            this._defaultPipeline.imageProcessing.vignetteCenterX = envSetting.main.postprocess.imageProcessing.vignette.centerX;
            this._defaultPipeline.imageProcessing.vignetteCenterY = envSetting.main.postprocess.imageProcessing.vignette.centerY;
            this._defaultPipeline.imageProcessing.vignetteColor = BABYLON.Color4.FromArray(envSetting.main.postprocess.imageProcessing.vignette.color);
            this._defaultPipeline.imageProcessing.vignetteBlendMode = envSetting.main.postprocess.imageProcessing.vignette.blendMode;

            this._defaultPipeline.imageProcessing.ditheringEnabled = envSetting.main.postprocess.imageProcessing.dithering.enabled;
            this._defaultPipeline.imageProcessing.ditheringIntensity = envSetting.main.postprocess.imageProcessing.dithering.intensity;

            //Sharpen
            this._defaultPipeline.sharpenEnabled = envSetting.main.postprocess.sharpen.enabled;
            this._defaultPipeline.sharpen.colorAmount = envSetting.main.postprocess.sharpen.colorAmount;
            this._defaultPipeline.sharpen.edgeAmount = envSetting.main.postprocess.sharpen.edgeAmount;

            this._defaultPipeline.prepare();
            this._defaultPipeline.automaticBuild = true;
        }

        //SSAO
        // if (ClientConfiguration.usePostProcess && envSetting.main.ssao) {
        //     this._ssaoPipeline = new BABYLON.SSAORenderingPipeline("ssao", this._scene, 1, cameras);
        //     this._ssaoPipeline.fallOff = envSetting.main.ssao.falloff;
        //     this._ssaoPipeline.area = envSetting.main.ssao.area;
        //     this._ssaoPipeline.radius = envSetting.main.ssao.radius;
        //     this._ssaoPipeline.totalStrength = envSetting.main.ssao.totalStrength;
        //     this._ssaoPipeline.base = envSetting.main.ssao.base;
        //     //this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", this._scene.activeCamera);
        // }


        this._updateSkyboxBlur();
        this._updateSkyboxRotAngle();

        return true;
    }

    public setDefaultPipeline() {
        // if (null != this._defaultPipeline) {
        //     this._defaultPipeline.dispose();
        //     this._defaultPipeline = null;
        // }

        // this._defaultPipeline = new BABYLON.DefaultRenderingPipeline("default", true, this._scene);
        // this._defaultPipeline.samples = 4;
    }

    //-----------------------------------------------------------------------------------
    // CreateCustomProperties
    //-----------------------------------------------------------------------------------
    private _createCustomProperties() {
        this._createCustomProperties_Skybox();
        this._createCustomProperies_SaveLoadColorCorrection();
        this._createCustomProperies_SaveLoadEnvSettings();
    }

    private _createCustomProperties_Skybox() {
        this.inspectableCustomProperties.push({
            label: "Skybox Blur",
            propertyName: "skyboxBlur",
            type: BABYLON.InspectableType.Slider,
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });

        this.inspectableCustomProperties.push({
            label: "Skybox RotAngle",
            propertyName: "skyboxRotAngle",
            type: BABYLON.InspectableType.Slider,
            min: 0.0,
            max: 360.0,
            step: 1.0,
        });

        this.inspectableCustomProperties.push({
            label: "Skybox Cubemap 로드",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadSkyboxCubemapTexture(file);
            }
        });
    }

    private _createCustomProperies_SaveLoadColorCorrection() {

        this.inspectableCustomProperties.push({
            label: "Color Correction 로드",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadColorCorrectionTexture(file);
            },
            accept: ".png"
        });
    }


    private _createCustomProperies_SaveLoadEnvSettings() {

        this.inspectableCustomProperties.push({
            label: "환경설정 저장",
            propertyName: "",
            type: BABYLON.InspectableType.Button,
            callback: () => {
                this._saveEnvSettings();
            }
        });

        this.inspectableCustomProperties.push({
            label: "환경설정 로드",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadEnvSettings(file);
            },
            accept: ".json"
        });
    }
    //-----------------------------------------------------------------------------------
    // Skybox
    //-----------------------------------------------------------------------------------
    private _skyboxBlur: number = 0.3;
    private _skyboxRotAngle: number = 0;

    private _skyboxMtl: BABYLON.Nullable<BABYLON.PBRMaterial> = null;
    private _skyboxMesh: BABYLON.Nullable<BABYLON.AbstractMesh> = null;

    public set skyboxBlur(value: number) {
        this._skyboxBlur = value;
        this._updateSkyboxBlur();
    }

    public get skyboxBlur() {
        return this._skyboxBlur;
    }

    public set skyboxRotAngle(value: number) {
        this._skyboxRotAngle = value;
        this._updateSkyboxRotAngle();
    }

    public get skyboxRotAngle() {
        return this._skyboxRotAngle;
    }

    private _updateSkyboxBlur() {
        if (this._skyboxMtl) {
            this._skyboxMtl.microSurface = 1.0 - this._skyboxBlur; //sceneHelper.createDefaultSkybox() 참조
        }
    }



    private _updateSkyboxRotAngle() {
        if (this._scene.environmentTexture) {
            const cubeTex = this._scene.environmentTexture as BABYLON.CubeTexture;
            if (cubeTex) {
                cubeTex.rotationY = BABYLON.Tools.ToRadians(this._skyboxRotAngle);
            }
        }

        if (this._skyboxMesh) {
            this._skyboxMesh.rotation.y = BABYLON.Tools.ToRadians(-this._skyboxRotAngle);//반대로 도는듯 (아트 확인 필요)
        }
    }

    private _loadSkyboxCubemapTexture(file: File) {
        const dropFile = file;
        const dropFileName = dropFile.name.toLowerCase();
        BABYLON.FilesInput.FilesToLoad[dropFileName] = dropFile; //==> "file:" 을 url로 사용시 바빌론 내부에서 FilesInput.FilesToLoad에서 File 을 찿는다
        const dropFilePath = "file:" + dropFileName;

        if (this._scene) {
            this._scene.environmentTexture = new BABYLON.CubeTexture(dropFilePath, this._scene, null, false, null, null, null, undefined, true, null, true);

            for (let i = 0; i < this._scene.materials.length; ++i) {
                const material = this._scene.materials[i] as BABYLON.StandardMaterial | BABYLON.PBRMaterial;
                if (material.name === "skyBox") {
                    const reflectionTexture = material.reflectionTexture;
                    if (reflectionTexture && reflectionTexture.coordinatesMode === BABYLON.Texture.SKYBOX_MODE) {
                        material.reflectionTexture = this._scene.environmentTexture.clone();
                        if (material.reflectionTexture) {
                            material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                        }
                    }
                }
            }

            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                this._lastLoadedEnvCubemapBase64 = e.target?.result as string;
            };

            fileReader.readAsDataURL(dropFile);
        }
    }

    //-----------------------------------------------------------------------------------
    // Save Load EnvSettings
    //-----------------------------------------------------------------------------------
    private _saveEnvSettings() {
        const envSettings = {
            "format": 3.0,
            "main": {
                "type": "Environment",
            }
        };

        this._appendEnvSetting_Skybox(envSettings.main);
        this._appendEnvSetting_HemiSphericLight(envSettings.main);
        this._appendEnvSetting_SunLight(envSettings.main);
        this._appendEnvSetting_PostProcess(envSettings.main);
        this._appendEnvSetting_ColorCorrection(envSettings.main);
        this._appendEnvSetting_SSAO(envSettings.main);

        const strEnvSettings = JSON.stringify(envSettings, undefined, 4);
        const blob = new Blob([strEnvSettings], { type: "application/json" });
        BABYLON.Tools.Download(blob, "environmentSetting.json");
    }

    private _loadEnvSettings(file: File) {
        BABYLON.Tools.ReadFile(file, (data) => {
            const envSettings = JSON.parse(data) as IAssetManifest_Environment;
            if (envSettings) {
                this._applyEnvironmentSetting(envSettings);
            }
            else {
                console.error("EnvironmentController._loadEnvSettings(): failed!!");
            }
        });
    }

    private _appendEnvSetting_Skybox(setting: any) {
        if ((null !== this._skyboxMtl) && (null !== this._scene.environmentTexture)) {
            setting["skybox"] = {
                "envMapBase64": this._lastLoadedEnvCubemapBase64,
                "blur": this._skyboxBlur,
                "rotAngle": this._skyboxRotAngle,
            };
        }
    }

    private _appendEnvSetting_HemiSphericLight(setting: any) {
        if (this._hemiLight) {
            setting["hemiSphericLight"] = {
                "dir": this._hemiLight.direction.asArray(),
                "intensity": this._hemiLight.intensity,
                "skyColor": this._hemiLight.diffuse.asArray(),
                "groundColor": this._hemiLight.groundColor.asArray()
            };
        }
    }

    private _appendEnvSetting_SunLight(setting: any) {
        if (this._sunLight) {
            setting["sun"] = {
                "dir": this._sunLight.direction.asArray(),
                "intensity": this._sunLight.intensity,
                "color": this._sunLight.diffuse.asArray(),
                "specColor": this._sunLight.specular.asArray(),
                "pos": this._sunLight.position.asArray(),

            };
        }
    }

    private _appendEnvSetting_PostProcess(setting: any) {
        this._findDefaultPostProcess();

        if (this._defaultPipeline) {
            setting["postprocess"] = {
                "bloom": {
                    "enabled": this._defaultPipeline.bloomEnabled,
                    "threshold": this._defaultPipeline.bloomThreshold,
                    "weight": this._defaultPipeline.bloomWeight,
                    "kernel": this._defaultPipeline.bloomKernel,
                    "scale": this._defaultPipeline.bloomScale,
                },
                "chromaticAberration": {
                    "enabled": this._defaultPipeline.chromaticAberrationEnabled,
                    "aberrationAmount": this._defaultPipeline.chromaticAberration.aberrationAmount,
                    "radialIntensity": this._defaultPipeline.chromaticAberration.radialIntensity,
                    "center": this._defaultPipeline.chromaticAberration.centerPosition.asArray(),
                    "direction": this._defaultPipeline.chromaticAberration.direction.asArray(),
                },
                "DOF": {
                    "enabled": this._defaultPipeline.depthOfFieldEnabled,
                    "focalLength": this._defaultPipeline.depthOfField.focalLength,
                    "fStop": this._defaultPipeline.depthOfField.fStop,
                    "distance": this._defaultPipeline.depthOfField.focusDistance,
                    "lensSize": this._defaultPipeline.depthOfField.lensSize,
                    "blurLevel": this._defaultPipeline.depthOfFieldBlurLevel,
                },
                "FXAA": {
                    "enabled": this._defaultPipeline.fxaaEnabled
                },
                "glowLayer": {
                    "enabled": this._defaultPipeline.glowLayerEnabled,
                    "blurKernelSize": this._defaultPipeline.glowLayer ? this._defaultPipeline.glowLayer.blurKernelSize : 0,
                    "intensity": this._defaultPipeline.glowLayer ? this._defaultPipeline.glowLayer.intensity : 0,
                },
                "grain": {
                    "enabled": this._defaultPipeline.grainEnabled,
                    "animated": this._defaultPipeline.grain.animated,
                    "intensity": this._defaultPipeline.grain.intensity,
                },
                "imageProcessing": {
                    "enabled": this._defaultPipeline.imageProcessingEnabled,
                    "contrast": this._defaultPipeline.imageProcessing.contrast,
                    "exposure": this._defaultPipeline.imageProcessing.exposure,
                    "toneMapping": {
                        "enabled": this._defaultPipeline.imageProcessing.toneMappingEnabled,
                        "type": this._defaultPipeline.imageProcessing.toneMappingType
                    },
                    "vignette": {
                        "enabled": this._defaultPipeline.imageProcessing.vignetteEnabled,
                        "weight": this._defaultPipeline.imageProcessing.vignetteWeight,
                        "stretch": this._defaultPipeline.imageProcessing.vignetteStretch,
                        "fov": this._defaultPipeline.imageProcessing.vignetteCameraFov,
                        "centerX": this._defaultPipeline.imageProcessing.vignetteCenterX,
                        "centerY": this._defaultPipeline.imageProcessing.vignetteCenterY,
                        "color": this._defaultPipeline.imageProcessing.vignetteColor.asArray(),
                        "blendMode": this._defaultPipeline.imageProcessing.vignetteBlendMode
                    },
                    "dithering": {
                        "enabled": this._defaultPipeline.imageProcessing.ditheringEnabled,
                        "intensity": this._defaultPipeline.imageProcessing.ditheringIntensity,
                    }
                },
                "sharpen": {
                    "enabled": this._defaultPipeline.sharpenEnabled,
                    "colorAmount": this._defaultPipeline.sharpen.colorAmount,
                    "edgeAmount": this._defaultPipeline.sharpen.edgeAmount
                }
            };

        }
    }

    private _appendEnvSetting_ColorCorrection(setting: any) {
        if (this._scene.imageProcessingConfiguration.colorGradingEnabled) {
            setting["colorCorrection"] = {
                "enabled": this._scene.imageProcessingConfiguration.colorGradingEnabled,
                "lutTexName": this._scene.imageProcessingConfiguration.colorGradingTexture?.name.split(":")[1],
                "lutTexBase64": this._convertColorCorrectionTextureToBase64(),
                "level": this._scene.imageProcessingConfiguration.colorGradingTexture ? this._scene.imageProcessingConfiguration.colorGradingTexture.level : 0
            };
        }
    }

    private _appendEnvSetting_SSAO(setting: any) {
        this._findSSAOPostProcess();
        if (this._ssaoPipeline) {
            setting["ssao"] = {
                "totalStrength": this._ssaoPipeline.totalStrength,
                "base": this._ssaoPipeline.base,
                "radius": this._ssaoPipeline.radius,
                "area": this._ssaoPipeline.area,
                "falloff": this._ssaoPipeline.fallOff
            };
        }
    }
    //-----------------------------------------------------------------------------------
    // Color Correction
    //-----------------------------------------------------------------------------------
    private _loadColorCorrectionTexture(file: File) {
        const dropFile = file;
        const dropFileName = dropFile.name.toLowerCase();
        BABYLON.FilesInput.FilesToLoad[dropFileName] = dropFile; //==> "file:" 을 url로 사용시 바빌론 내부에서 FilesInput.FilesToLoad에서 File 을 찿는다
        const dropFilePath = "file:" + dropFileName;

        var colorGrading = new BABYLON.Texture(dropFilePath, this._scene, true, false);
        colorGrading.anisotropicFilteringLevel = 1;
        colorGrading.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        colorGrading.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

        this._scene.imageProcessingConfiguration.colorGradingEnabled = true;
        this._scene.imageProcessingConfiguration.colorGradingTexture = colorGrading;
        this._scene.imageProcessingConfiguration.colorGradingWithGreenDepth = false;
        colorGrading.level = 1;
    }

    private _convertColorCorrectionTextureToBase64(): string {
        if (this._scene.imageProcessingConfiguration.colorGradingTexture) {
            return BABYLON.GenerateBase64StringFromTexture(this._scene.imageProcessingConfiguration.colorGradingTexture) || "";
        }
        return "";
    }

    private _findDefaultPostProcess() {
        if (!this._defaultPipeline) {
            const pipelines = this._scene.postProcessRenderPipelineManager.supportedPipelines;
            for (let ii = 0; ii < pipelines.length; ++ii) {
                if (pipelines[ii] instanceof BABYLON.DefaultRenderingPipeline) {
                    this._defaultPipeline = pipelines[ii] as BABYLON.DefaultRenderingPipeline;
                    break;
                }
            }
        }
    }

    private _findSSAOPostProcess() {
        if (!this._ssaoPipeline) {
            const pipelines = this._scene.postProcessRenderPipelineManager.supportedPipelines;
            for (let ii = 0; ii < pipelines.length; ++ii) {
                if (pipelines[ii] instanceof BABYLON.SSAORenderingPipeline) {
                    this._ssaoPipeline = pipelines[ii] as BABYLON.SSAORenderingPipeline;
                    break;
                }
            }
        }
    }

}