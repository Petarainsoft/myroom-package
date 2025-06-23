import * as React from "react";
import * as BABYLON from "@babylonjs/core";

import { TreeItemLabelComponent } from "./treeItemLabelComponent";
import { faProjectDiagram } from "@fortawesome/free-solid-svg-icons";
import { GlobalState } from "../../globalState";
import { IEntityInfo } from "../../types";
import { AbstractMesh, Material } from "@babylonjs/core";
import { MeshTreeItemComponent } from "./entities/meshTreeItemComponent";
import { MaterialTreeItemComponent } from "./entities/materialTreeItemComponent";
import { IUsingMaterialInfo } from "@/core/front/editorMode/modelController";
import { TextureTreeItemComponent } from "./entities/textureTreeItemComponent";

interface ITreeItemSpecializedComponentProps {
    label: string;
    entity?: IEntityInfo;
    globalState: GlobalState;
    onClick?: () => void;
}

export class TreeItemSpecializedComponent extends React.Component<ITreeItemSpecializedComponentProps> {
    constructor(props: ITreeItemSpecializedComponentProps) {
        super(props);
    }

    onClick() {
        if (!this.props.onClick) {
            return;
        }

        this.props.onClick();
    }

    render() {
        const entity = this.props.entity;

        if (entity) {
            if (entity.type === "Mesh") {
                const mesh = entity.object as AbstractMesh;
                return (
                    <MeshTreeItemComponent globalState={this.props.globalState} mesh={mesh} onClick={() => this.onClick()} />
                );
            }

            if(entity.type === "Material"){
                const materialInfo = entity.object as IUsingMaterialInfo;
                return (
                    <MaterialTreeItemComponent materialInfo={materialInfo} onClick={() => this.onClick()} />
                );
            }

            if(entity.type === "Texture"){
                const texteure = entity.object as BABYLON.BaseTexture;
                return (
                    <TextureTreeItemComponent texture={texteure as BABYLON.Texture} onClick={() => this.onClick()} />
                );
            }
        }

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={"<not handled entity type>"} onClick={() => this.onClick()} icon={faProjectDiagram} color="cornflowerblue" />
            </div>
        );
    }
}
