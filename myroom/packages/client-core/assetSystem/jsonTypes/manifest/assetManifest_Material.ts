import { NodeMaterialBlockConnectionPointTypes, AbstractMesh } from "@babylonjs/core";
import { IAssetManifest } from "./assetManifest";
import { indexOf } from "lodash";

export interface IAssetManifest_Material extends IAssetManifest {
    format: number;
    main:
    {
        type: string,
        name: string,
        materialType: string,
        data: any;
    };
}

//---------------------------------------------------------------------------------------
// Node Material Json 관련
//  NodeMaterial 일경우는 메터리얼을 serialize() 하지 않고 Input Value 들만 저장하기위해
//---------------------------------------------------------------------------------------
export enum ENodeMaterialType {
    None = "None",
    Avatar = "Avatar",
    Water = "Water",
}

export class NodeMaterialConstants {
    static readonly NODE_MATERIAL_NAME_AVATAR = "AvatarSkinNodeMaterial";
    static readonly NODE_MATERIAL_NAME_MYROOM_SKIN_WATER = "MyroomSkinWaterNodeMaterial";
}

export const getNodeMaterialName = (type: ENodeMaterialType): string => {
    if (type === ENodeMaterialType.Avatar) {
        return NodeMaterialConstants.NODE_MATERIAL_NAME_AVATAR;
    }
    else if (type === ENodeMaterialType.Water) {
        return NodeMaterialConstants.NODE_MATERIAL_NAME_MYROOM_SKIN_WATER;
    }

    return "";
};

export const convertStringToNodeMaterialType = (type: string): ENodeMaterialType => {
    if (type === ENodeMaterialType.Avatar) {
        return ENodeMaterialType.Avatar;
    }
    else if (type === ENodeMaterialType.Water) {
        return ENodeMaterialType.Water;
    }

    return ENodeMaterialType.None;
};

export interface IMaterialCommonData {
    //General
    depthFunction?: number;
    needDepthPrePass?: boolean;

    //TRANSPARENCY
    alpha: number;
    transparencyMode: number | null;
    alphaMode: number;

}

export interface INodeMaterialData_InputValue {
    name: string;
    id: number;
    valueType: string;
    value: any;
}

export interface INodeMaterialData_Texture {
    name: string;
    id: number;
    //textureData: any;
}

export interface IMaterialData_Node {
    type: ENodeMaterialType;
    commonData?: IMaterialCommonData;
    inputValues: INodeMaterialData_InputValue[];
    textures: INodeMaterialData_Texture[];
}

//---------------------------------------------------------------------------------------
// PBR Material 관련
//---------------------------------------------------------------------------------------
export interface IPBRMaterialData_OverwriteTextures {
    useAlbedoTexture: boolean;
    useMetallicTexture: boolean;
    useReflectionTexture: boolean;
    useRefractionTexture: boolean;
    useReflectivityTexture: boolean;
    useMicroSurfaceTexture: boolean;
    useBumpTexture: boolean;
    useEmissiveTexture: boolean;
    useOpacityTexture: boolean;
    useAmbientTexture: boolean;
    useLightmapTexture: boolean;
}

export interface IPBRMaterialData_LightingAndColor {
    albedoColor: number[];
    reflectivityColor: number[];
    microSurface: number;
    emissiveColor: number[];
    ambientColor: number[];
    usePhysicalLightFalloff: boolean;
}

export interface IPBRMaterialData_MetallicWorkflow {
    metallic: number | null;
    roughness: number | null;
    indexOfRefraction: number;
    F0Factor: number;
    reflectanceColor: number[];
}

export interface IMaterialData_PBR {
    targetMeshPath: string;
    commonData: IMaterialCommonData;
    overwriteTextures: IPBRMaterialData_OverwriteTextures;
    lightingAndColorData: IPBRMaterialData_LightingAndColor;
    metalicWorkflowData: IPBRMaterialData_MetallicWorkflow;
}
