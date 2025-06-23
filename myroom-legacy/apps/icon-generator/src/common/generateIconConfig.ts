export interface IGenerateIconConfig {
    cameraSettings: {
        alpha: number;
        beta: number;
        target?: number[];
        radius?: number; // optional 없을경우 bounding 계산해서 자동으로 설정
        fov?: number;
    };

    skeleton?: string;
    animation?: string;

    extraModles: string[];

    ignoreGenerateIcon?: boolean;
}