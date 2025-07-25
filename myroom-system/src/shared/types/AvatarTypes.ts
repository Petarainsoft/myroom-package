// Avatar-related type definitions

export interface ActiveMovement {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    jump: boolean;
    run: boolean;
    wave: boolean;
    dance: boolean;
}

export interface TouchMovement {
    x: number;
    y: number;
    isMoving: boolean;
    durationBoost?: number;
}

export interface TouchRotation {
    delta: number;
}

// Avatar configuration types
export interface PartItem {
    name: string;
    fileName: string | null;
    resourceId?: string; // Optional resourceId for backend API integration
}

export interface GenderSelectableParts {
    hair: PartItem[];
    top: PartItem[];
    bottom?: PartItem[];
    shoes?: PartItem[];
    accessory?: PartItem[];
    fullset?: PartItem[];
}

export interface GenderFixedParts {
    body: string;
}

export interface GenderDefaultColors {
    hair?: string;
    top?: string;
    bottom?: string;
    shoes?: string;
    accessory?: string;
    fullset?: string;
    [key: string]: string | undefined;
}

export interface GenderData {
    fixedParts: GenderFixedParts;
    selectableParts: GenderSelectableParts;
    defaultColors: GenderDefaultColors;
}

export interface AvailableParts {
    male: GenderData;
    female: GenderData;
}

export interface AvatarPartPaths {
    body: string;
    hair: string | null;
    top: string | null;
    bottom?: string | null;
    shoes?: string | null;
    accessory?: string | null;
    [key: string]: string | null | undefined;
}

export interface AvatarColors {
    hair?: string;
    top?: string;
    bottom?: string;
    shoes?: string;
    accessory?: string;
    [key: string]: string | undefined;
}

export type Gender = keyof AvailableParts;

export interface AvatarConfig {
    gender: Gender;
    parts: AvatarPartPaths;
    colors: AvatarColors;
}