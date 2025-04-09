import { ConstantsEx } from "./assetSystem/constantsEx";

export enum PerformanceLevel {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
}
export enum ShadowType {
    NONE = 0,
    SIMPLE = 1,
    PCF = 2,
    CONTACT_HARDENING = 3,
}

// 설정에 필요한 key
const OPTION_PERFORMANCE = "option.perform";
export class ClientConfiguration {
    private static _hardwareScalingLevel: number = 1;
    private static _usePostProcess: boolean = true;
    private static _shadowType: ShadowType = ShadowType.PCF;
    private static _shadowSize: number = 1024;

    private static _performanceLevel: PerformanceLevel = PerformanceLevel.HIGH;

    public static get hardwareScalingLevel(): number {
        return this._hardwareScalingLevel;
    }
    public static get usePostProcess(): boolean {
        return this._usePostProcess;
    }
    public static get performanceLevel(): PerformanceLevel {
        return this._performanceLevel;
    }
    public static get shadowType(): ShadowType {
        return this._shadowType;
    }
    public static get shadowSize(): number {
        return this._shadowSize;
    }

    public static initialize() {
        const level = window.localStorage.getItem(OPTION_PERFORMANCE);
        if (level) {
            this._performanceLevel = parseInt(level);
            console.log("_performanceLevel", this._performanceLevel);
        } else {
            this._performanceLevel = PerformanceLevel.MEDIUM;
        }
        this._applyPerformaceLevel();
    }

    public static setPerformanceOption(level: PerformanceLevel) {
        console.log("setPerformanceOption", level.toString());
        window.localStorage.setItem(OPTION_PERFORMANCE, level.toString());
        this._performanceLevel = level;

        this._applyPerformaceLevel();
    }

    private static _applyPerformaceLevel() {
        switch (this._performanceLevel) {
            case PerformanceLevel.HIGH:
                this._hardwareScalingLevel = 1 / 2;
                this._usePostProcess = true;
                // CONTACT_HARDENING로 하면, 중사양pc에서는 느리다. 그래서 퀄리티에 큰 차이없는 pcf로 한다.
                this._shadowType = ShadowType.PCF;
                this._shadowSize = 2048;
                break;
            case PerformanceLevel.MEDIUM:
                this._hardwareScalingLevel = 2 / 3;
                this._usePostProcess = true;
                this._shadowType = ShadowType.PCF;
                this._shadowSize = 1024;
                break;
            default:
                this._hardwareScalingLevel = 1;
                this._usePostProcess = false;
                this._shadowType = ShadowType.SIMPLE;
                this._shadowSize = 1024;
                break;
        }
    }
}