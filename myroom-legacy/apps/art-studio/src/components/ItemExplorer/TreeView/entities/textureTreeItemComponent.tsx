import type { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { faImage } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import * as React from "react";

interface ITextureTreeItemComponentProps {
    texture: Texture;
    onClick: () => void;
}

export class TextureTreeItemComponent extends React.Component<ITextureTreeItemComponentProps> {
    constructor(props: ITextureTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="textureTools">
                <TreeItemLabelComponent label={this.props.texture.name} onClick={() => this.props.onClick()} icon={faImage} color="mediumpurple" />
            </div>
        );
    }
}
