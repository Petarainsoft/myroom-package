import type { Material } from "@babylonjs/core/Materials/material";
import { faBrush, faPen } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import * as React from "react";
import type { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { IUsingMaterialInfo } from "@/core/front/editorMode/modelController";
import { EditorApp } from "@/core/front/editorApp";
import { EditorMode_ItemEditor } from "@/core/front/editorMode/editorMode_MaterialEditor";

interface IMaterialTreeItemComponentProps {
    materialInfo: IUsingMaterialInfo
    onClick: () => void;
}

export class MaterialTreeItemComponent extends React.Component<IMaterialTreeItemComponentProps> {
    constructor(props: IMaterialTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="materialTools">
                <TreeItemLabelComponent
                    label={this.props.materialInfo.name}
                    onClick={() => this.props.onClick()}
                    icon={faBrush} color="orange" />
            </div>
        );
    }
}
