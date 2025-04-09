export enum EBuildType {
    //App
    AppDev,
    AppIR,
    AppPR,
    AppRC,
    AppLive,

    //Tools
    DevTool,
}

export class BuildConfig {
    private static _enviroment = "DEV";
    private static _isDevTool = false;

    public static initialize(buildType: EBuildType) {
        switch (buildType) {
            case EBuildType.AppDev: { this._enviroment = "DEV"; } break;
            case EBuildType.AppIR: { this._enviroment = "IR"; } break;
            case EBuildType.AppPR: { this._enviroment = "PR"; } break;
            case EBuildType.AppRC: { this._enviroment = "RC"; } break;
            case EBuildType.AppLive: { this._enviroment = "LIVE"; } break;
            case EBuildType.DevTool: { this._enviroment = "DEV"; this._isDevTool = true; } break;
            default: { this._enviroment = "DEV"; this._isDevTool = false; } break;
        }
        console.log(`BuildConfig.initialize() : ${this._enviroment} , isDevTool = ${this._isDevTool}`);
    }

    public static get environment(): string {
        return this._enviroment;
    }

    public static get isDevTool(): boolean {
        return this._isDevTool;
    }
}