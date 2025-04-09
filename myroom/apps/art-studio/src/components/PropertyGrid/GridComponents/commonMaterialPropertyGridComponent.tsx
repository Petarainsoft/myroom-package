import * as React from "react";

import type { Observable } from "@babylonjs/core/Misc/observable";
import { Material } from "@babylonjs/core/Materials/material";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Engine } from "@babylonjs/core/Engines/engine";

import type { PropertyChangedEvent } from "client-tools-ui-components/propertyChangedEvent";
import { CheckBoxLineComponent } from "client-tools-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "client-tools-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "client-tools-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "client-tools-ui-components/lines/textLineComponent";
import { OptionsLineComponent, Null_Value } from "client-tools-ui-components/lines/optionsLineComponent";
import type { LockObject } from "client-tools-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../globalState";
import { ButtonLineComponent } from "client-tools-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "client-tools-ui-components/lines/textInputLineComponent";
import { HexLineComponent } from "client-tools-ui-components/lines/hexLineComponent";
import { FloatLineComponent } from "client-tools-ui-components/lines/floatLineComponent";

interface ICommonMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: Material;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonMaterialPropertyGridComponent extends React.Component<ICommonMaterialPropertyGridComponentProps> {
    constructor(props: ICommonMaterialPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const material = this.props.material;

        material.depthFunction = material.depthFunction ?? 0;

        const orientationOptions = [
            { label: "Clockwise", value: Material.ClockWiseSideOrientation },
            { label: "Counterclockwise", value: Material.CounterClockWiseSideOrientation },
        ];

        const transparencyModeOptions = [
            { label: "<Not Defined>", value: Null_Value },
            { label: "Opaque", value: PBRMaterial.PBRMATERIAL_OPAQUE },
            { label: "Alpha test", value: PBRMaterial.PBRMATERIAL_ALPHATEST },
            { label: "Alpha blend", value: PBRMaterial.PBRMATERIAL_ALPHABLEND },
            { label: "Alpha blend and test", value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND },
        ];

        const alphaModeOptions = [
            { label: "Combine", value: Constants.ALPHA_COMBINE },
            { label: "One one", value: Constants.ALPHA_ONEONE },
            { label: "Add", value: Constants.ALPHA_ADD },
            { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
            { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
            { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
            { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
        ];

        const depthfunctionOptions = [
            { label: "<Engine Default>", value: 0 },
            { label: "Never", value: Engine.NEVER },
            { label: "Always", value: Engine.ALWAYS },
            { label: "Equal", value: Engine.EQUAL },
            { label: "Less", value: Engine.LESS },
            { label: "Less or equal", value: Engine.LEQUAL },
            { label: "Greater", value: Engine.GREATER },
            { label: "Greater or equal", value: Engine.GEQUAL },
            { label: "Not equal", value: Engine.NOTEQUAL },
        ];

        const stencilFunctionOptions = [
            { label: "Never", value: Constants.NEVER },
            { label: "Always", value: Constants.ALWAYS },
            { label: "Equal", value: Constants.EQUAL },
            { label: "Less", value: Constants.LESS },
            { label: "Less or equal", value: Constants.LEQUAL },
            { label: "Greater", value: Constants.GREATER },
            { label: "Greater or equal", value: Constants.GEQUAL },
            { label: "Not equal", value: Constants.NOTEQUAL },
        ];

        const stencilOperationOptions = [
            { label: "Keep", value: Constants.KEEP },
            { label: "Zero", value: Constants.ZERO },
            { label: "Replace", value: Constants.REPLACE },
            { label: "Incr", value: Constants.INCR },
            { label: "Decr", value: Constants.DECR },
            { label: "Invert", value: Constants.INVERT },
            { label: "Incr wrap", value: Constants.INCR_WRAP },
            { label: "Decr wrap", value: Constants.DECR_WRAP },
        ];

        return (
            <div>
                <LineContainerComponent title="GENERAL" >
                    <TextLineComponent label="ID" value={material.id} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={material}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLineComponent
                        label="Depth function"
                        options={depthfunctionOptions}
                        target={material}
                        propertyName="depthFunction"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ depthFunction: value })}
                    />
                    <CheckBoxLineComponent
                        label="Need depth pre-pass"
                        target={material}
                        propertyName="needDepthPrePass"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSPARENCY">
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Alpha"
                        target={material}
                        propertyName="alpha"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {(material as any).transparencyMode !== undefined && (
                        <OptionsLineComponent
                            allowNullValue={true}
                            label="Transparency mode"
                            options={transparencyModeOptions}
                            target={material}
                            propertyName="transparencyMode"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onSelect={(value) => this.setState({ transparencyMode: value })}
                        />
                    )}
                    <OptionsLineComponent
                        label="Alpha mode"
                        options={alphaModeOptions}
                        target={material}
                        propertyName="alphaMode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ alphaMode: value })}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
