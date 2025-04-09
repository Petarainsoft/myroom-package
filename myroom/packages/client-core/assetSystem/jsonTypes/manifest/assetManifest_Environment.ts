import { IAssetManifest } from "./assetManifest";

export interface IAssetManifest_Environment extends IAssetManifest {
    format: number;
    main:
    {
        type: string,

        skybox: {
            envMapBase64: string,
            blur: number,
            rotAngle: number,
        },

        hemiSphericLight?: {
            dir: number[],
            intensity: number,
            skyColor: number[],
            groundColor: number[];
        },

        sun?: {
            dir: number[],
            intensity: number,
            color: number[],
            specColor: number[],
            pos?: number[];
        },

        postprocess?: {
            bloom: {
                enabled: boolean;
                threshold: number,
                weight: number,
                kernel: number,
                scale: number;
            },

            chromaticAberration: {
                enabled: boolean,
                aberrationAmount: number,
                radialIntensity: number,
                center: number[],
                direction: number[];
            },

            DOF: {
                enabled: boolean;
                focalLength: number,
                fStop: number,
                distance: number,
                lensSize: number,
                blurLevel: number;
            },

            FXAA: {
                enabled: boolean;
            };

            glowLayer: {
                enabled: boolean,
                blurKernelSize: number,
                intensity: number;
            },

            grain: {
                enabled: boolean,
                animated: boolean,
                intensity: number;
            },

            imageProcessing: {
                enabled: boolean,
                contrast: number,
                exposure: number,
                toneMapping: {
                    enabled: boolean,
                    type: number;
                },
                vignette: {
                    enabled: boolean,
                    weight: number,
                    stretch: number,
                    fov: number,
                    centerX: number,
                    centerY: number,
                    color: number[],
                    blendMode: number;
                },
                dithering: {
                    enabled: boolean,
                    intensity: number;
                };
            },

            sharpen: {
                enabled: boolean,
                colorAmount: number,
                edgeAmount: number;
            },
        },

        colorCorrection?: {
            enabled: boolean,
            lutTexName: string;
            lutTexBase64: string,
            level: number;
        },

        ssao?: {
            totalStrength: number,
            base: number,
            radius: number,
            area: number,
            falloff: number,
        };
    };
}