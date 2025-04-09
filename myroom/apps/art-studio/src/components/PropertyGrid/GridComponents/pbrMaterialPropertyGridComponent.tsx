import * as React from "react";

import { Observable } from "@babylonjs/core/Misc/observable";
import type { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Constants } from "@babylonjs/core/Engines/constants";

import type { PropertyChangedEvent } from "client-tools-ui-components/propertyChangedEvent";
import { LineContainerComponent } from "client-tools-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "client-tools-ui-components/lines/color3LineComponent";
import { CheckBoxLineComponent } from "client-tools-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "client-tools-ui-components/lines/sliderLineComponent";
import { OptionsLineComponent } from "client-tools-ui-components/lines/optionsLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../Lines/textureLinkLineComponent";
import type { LockObject } from "client-tools-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../globalState";
import { Vector2LineComponent } from "client-tools-ui-components/lines/vector2LineComponent";

import "@babylonjs/core/Materials/material.decalMap";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import "@babylonjs/core/Rendering/subSurfaceSceneComponent";

interface IPBRMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    //targetMesh:string;
    material: PBRMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class PBRMaterialPropertyGridComponent extends React.Component<IPBRMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();
    constructor(props: IPBRMaterialPropertyGridComponentProps) {
        super(props);
    }

    switchAmbientMode(state: boolean) {
        this.props.material.debugMode = state ? 21 : 0;
    }

    renderTextures(onDebugSelectionChangeObservable: Observable<TextureLinkLineComponent>) {
        const material = this.props.material;

        return (
            <LineContainerComponent title="CHANNELS">
                <TextureLinkLineComponent
                    label="Albedo"
                    texture={material.albedoTexture}
                    propertyName="albedoTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Metallic Roughness"
                    texture={material.metallicTexture}
                    propertyName="metallicTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Reflection"
                    texture={material.reflectionTexture}
                    propertyName="reflectionTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Refraction"
                    texture={material.refractionTexture}
                    propertyName="refractionTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Reflectivity"
                    texture={material.reflectivityTexture}
                    propertyName="reflectivityTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Micro-surface"
                    texture={material.microSurfaceTexture}
                    propertyName="microSurfaceTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Bump"
                    texture={material.bumpTexture}
                    propertyName="bumpTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Emissive"
                    texture={material.emissiveTexture}
                    propertyName="emissiveTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Opacity"
                    texture={material.opacityTexture}
                    propertyName="opacityTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    customDebugAction={(state) => this.switchAmbientMode(state)}
                    label="Ambient"
                    texture={material.ambientTexture}
                    propertyName="ambientTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Lightmap"
                    texture={material.lightmapTexture}
                    propertyName="lightmapTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Detailmap"
                    texture={material.detailMap.texture}
                    material={material}
                    onTextureCreated={(texture) => (material.detailMap.texture = texture)}
                    onTextureRemoved={() => (material.detailMap.texture = null)}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                {/* <CheckBoxLineComponent
                    label="Use lightmap as shadowmap"
                    target={material}
                    propertyName="useLightmapAsShadowmap"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    label="Use detailmap"
                    target={material.detailMap}
                    propertyName="isEnabled"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                {material.decalMap && (
                    <CheckBoxLineComponent
                        label="Use decalmap"
                        target={material.decalMap}
                        propertyName="isEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )} */}
            </LineContainerComponent>
        );
    }

    render() {
        const material = this.props.material;

        const debugMode = [
            { label: "None", value: 0 },
            // Geometry
            { label: "Normalized position", value: 1 },
            { label: "Normals", value: 2 },
            { label: "Tangents", value: 3 },
            { label: "Bitangents", value: 4 },
            { label: "Bump Normals", value: 5 },
            { label: "UV1", value: 6 },
            { label: "UV2", value: 7 },
            { label: "ClearCoat Normals", value: 8 },
            { label: "ClearCoat Tangents", value: 9 },
            { label: "ClearCoat Bitangents", value: 10 },
            { label: "Anisotropic Normals", value: 11 },
            { label: "Anisotropic Tangents", value: 12 },
            { label: "Anisotropic Bitangents", value: 13 },
            // Maps
            { label: "Albedo Map", value: 20 },
            { label: "Ambient Map", value: 21 },
            { label: "Opacity Map", value: 22 },
            { label: "Emissive Map", value: 23 },
            { label: "Light Map", value: 24 },
            { label: "Metallic Map", value: 25 },
            { label: "Reflectivity Map", value: 26 },
            { label: "ClearCoat Map", value: 27 },
            { label: "ClearCoat Tint Map", value: 28 },
            { label: "Sheen Map", value: 29 },
            { label: "Anisotropic Map", value: 30 },
            { label: "Thickness Map", value: 31 },
            // Env
            { label: "Env Refraction", value: 40 },
            { label: "Env Reflection", value: 41 },
            { label: "Env Clear Coat", value: 42 },
            // Lighting
            { label: "Direct Diffuse", value: 50 },
            { label: "Direct Specular", value: 51 },
            { label: "Direct Clear Coat", value: 52 },
            { label: "Direct Sheen", value: 53 },
            { label: "Env Irradiance", value: 54 },
            // Lighting Params
            { label: "Surface Albedo", value: 60 },
            { label: "Reflectance 0", value: 61 },
            { label: "Metallic", value: 62 },
            { label: "Metallic F0", value: 71 },
            { label: "Roughness", value: 63 },
            { label: "AlphaG", value: 64 },
            { label: "NdotV", value: 65 },
            { label: "ClearCoat Color", value: 66 },
            { label: "ClearCoat Roughness", value: 67 },
            { label: "ClearCoat NdotV", value: 68 },
            { label: "Transmittance", value: 69 },
            { label: "Refraction Transmittance", value: 70 },
            // Misc
            { label: "SEO", value: 80 },
            { label: "EHO", value: 81 },
            { label: "Energy Factor", value: 82 },
            { label: "Specular Reflectance", value: 83 },
            { label: "Clear Coat Reflectance", value: 84 },
            { label: "Sheen Reflectance", value: 85 },
            { label: "Luminance Over Alpha", value: 86 },
            { label: "Alpha", value: 87 },
        ];

        const realTimeFilteringQualityOptions = [
            { label: "Low", value: Constants.TEXTURE_FILTERING_QUALITY_LOW },
            { label: "Medium", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM },
            { label: "High", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH },
        ];

        (material.sheen as any)._useRoughness = (material.sheen as any)._useRoughness ?? material.sheen.roughness !== null;
        material.sheen.roughness = material.sheen.roughness ?? (material.sheen as any)._saveRoughness ?? 0;

        if (!(material.sheen as any)._useRoughness) {
            (material.sheen as any)._saveRoughness = material.sheen.roughness;
            material.sheen.roughness = null;
        }

        return (
            <div className = "panes">
                <div className = "pane">
                    <CommonMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        lockObject={this.props.lockObject}
                        material={material}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <LineContainerComponent title="LIGHTING & COLORS">
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Albedo"
                            target={material}
                            propertyName="albedoColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            isLinear={true}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Reflectivity"
                            target={material}
                            propertyName="reflectivityColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            isLinear={true}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Micro-surface"
                            target={material}
                            propertyName="microSurface"
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Emissive"
                            target={material}
                            propertyName="emissiveColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            isLinear={true}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Ambient"
                            target={material}
                            propertyName="ambientColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            isLinear={true}
                        />
                        <CheckBoxLineComponent
                            label="Use physical light falloff"
                            target={material}
                            propertyName="usePhysicalLightFalloff"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="METALLIC WORKFLOW">
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Metallic"
                            target={material}
                            propertyName="metallic"
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Roughness"
                            target={material}
                            propertyName="roughness"
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Index of Refraction"
                            target={material}
                            propertyName="indexOfRefraction"
                            minimum={1}
                            maximum={3}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="F0 Factor"
                            target={material}
                            propertyName="metallicF0Factor"
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Reflectance Color"
                            target={material}
                            propertyName="metallicReflectanceColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            isLinear={true}
                        />
                        {/*<CheckBoxLineComponent
                            label="Use only metallic from MetallicReflectance texture"
                            target={material}
                            propertyName="useOnlyMetallicFromMetallicReflectanceTexture"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <TextureLinkLineComponent
                            label="MetallicReflectance Texture"
                            texture={material.metallicReflectanceTexture}
                            onTextureCreated={(texture) => (material.metallicReflectanceTexture = texture)}
                            onTextureRemoved={() => (material.metallicReflectanceTexture = null)}
                            material={material}
                            onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                            onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                        />
                        <TextureLinkLineComponent
                            label="Reflectance Texture"
                            texture={material.reflectanceTexture}
                            onTextureCreated={(texture) => (material.reflectanceTexture = texture)}
                            onTextureRemoved={() => (material.reflectanceTexture = null)}
                            material={material}
                            onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                            onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                        /> */}
                    </LineContainerComponent>
                    {this.renderTextures(this._onDebugSelectionChangeObservable)}
                </div>
            </div>
        );
    }
}
