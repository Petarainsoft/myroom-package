import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "client-tools-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "client-tools-ui-components/lines/checkBoxLineComponent";
import type { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";

import { Vector2LineComponent } from "client-tools-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "client-tools-ui-components/lines/vector3LineComponent";
import { Vector4LineComponent } from "client-tools-ui-components/lines/vector4LineComponent";
import { Color3LineComponent } from "client-tools-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "client-tools-ui-components/lines/color4LineComponent";
import type { LockObject } from "client-tools-ui-components/tabs/propertyGrids/lockObject";
import { FloatLineComponent } from "client-tools-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "client-tools-ui-components/lines/sliderLineComponent";
import { NodeMaterial, Observable } from "@babylonjs/core";
import { PropertyChangedEvent } from "client-tools-ui-components/propertyChangedEvent";
import { TextureLinkLineComponent } from "../Lines/textureLinkLineComponent";
import { GradientPropertyTabComponent } from "./gradientNodePropertyComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";

//---------------------------------------------------------------------------------------
// NodeMaterialPropertyGridComponent
//---------------------------------------------------------------------------------------
interface INodeMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: NodeMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onTextureAddedObservable?: ()=>void;
}

export class NodeMaterialPropertyGridComponent extends React.Component<INodeMaterialPropertyGridComponentProps> {
    constructor(props: INodeMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures() {
        const material = this.props.material;
        const textureBlocks = material.getTextureBlocks();

        if (!textureBlocks || textureBlocks.length === 0) {
            return null;
        }

        return (
            <LineContainerComponent title="TEXTURES" >
                {textureBlocks.map((textureBlock, i) => {
                    return (
                        <TextureLinkLineComponent
                            label={textureBlock.name}
                            key={"nodematText" + i}
                            texture={textureBlock.texture}
                            material={material}
                            onTextureCreated={(texture) => {textureBlock.texture = texture; this.props.onTextureAddedObservable?.();}}
                            onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        />
                    );
                })}
            </LineContainerComponent>
        );
    }

    render() {
        return (
            <div className = "panes">
                <div className = "pane">
                    <CommonMaterialPropertyGridComponent
                        globalState={this.props.globalState}
                        lockObject={this.props.lockObject}
                        material={this.props.material}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <InputsPropertyTabComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        inputs={this.props.material.getInputBlocks()}
                        material={this.props.material}
                    ></InputsPropertyTabComponent>
                    {this.renderTextures()}
                </div>
            </div>
        );
    }
}



//---------------------------------------------------------------------------------------
// InputsPropertyTabComponent
//---------------------------------------------------------------------------------------
interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: InputBlock[];
    lockObject: LockObject;
    material: NodeMaterial;
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate(ib: InputBlock) {
        // this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);

        // if (ib.isConstant) {
        //     this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        // }
    }

    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                return (
                    <div key={block.uniqueId}>
                        {block.isBoolean && (
                            <CheckBoxLineComponent
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onValueChanged={() => {
                                    this.processInputBlockUpdate(block);
                                }}
                            />
                        )}
                        {!block.isBoolean && cantDisplaySlider && (
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                        {!block.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={(block.max - block.min) / 100.0}
                                minimum={block.min}
                                maximum={block.max}
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                    </div>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
        }
        return null;
    }

    renderInputValues() {
        const configurableInputBlocks = this.props.inputs
            .filter((block) => {
                return block.visibleInInspector && block.isUniform && !block.isSystemValue;
            })
            .sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

        const namedGroups: string[] = [];
        configurableInputBlocks.forEach((block) => {
            if (!block.groupInInspector) {
                return;
            }

            if (namedGroups.indexOf(block.groupInInspector) === -1) {
                namedGroups.push(block.groupInInspector);
            }
        });
        namedGroups.sort();

        const gradiantNodeMaterialBlocks = this.props.material.attachedBlocks
            .filter((block) => {
                return block.visibleInInspector && block.getClassName() === "GradientBlock";
            })
            .sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

        const inputBlockContainer =
            configurableInputBlocks.length > 0 ? (
                <LineContainerComponent title="INPUTS">
                    {" "}
                    {configurableInputBlocks
                        .filter((block) => !block.groupInInspector)
                        .map((block) => {
                            return this.renderInputBlock(block);
                        })}
                </LineContainerComponent>
            ) : null;

        return (
            <>
                {inputBlockContainer}
                {namedGroups.map((name, i) => {
                    return (
                        <LineContainerComponent key={"inputValue" + i} title={name.toUpperCase()} >
                            {configurableInputBlocks
                                .filter((block) => block.groupInInspector === name)
                                .map((block) => {
                                    return this.renderInputBlock(block);
                                })}
                        </LineContainerComponent>
                    );
                })}
                {gradiantNodeMaterialBlocks.map((block, i) => {
                    return (
                        <LineContainerComponent key={block.name + i} title={block.name.toUpperCase()} >
                            {<GradientPropertyTabComponent globalState={this.props.globalState} block={block} />}
                        </LineContainerComponent>
                    );
                })}
            </>
        );
    }



    render() {
        return (
            // <LineContainerComponent title="INPUTS">
            //     {this.props.inputs.map((ib) => {
            //         if (!ib.isUniform || ib.isSystemValue || !ib.name ) {
            //             return null;
            //         }
            //         return this.renderInputBlock(ib);
            //     })}
            // </LineContainerComponent>
            <>
                {this.renderInputValues()}
            </>
        );
    }
}