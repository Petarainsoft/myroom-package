import type { GlobalState } from "../../globalState";
import type { NodeMaterialBlock } from "@babylonjs/core/Materials/Node/nodeMaterialBlock";

export interface IPropertyComponentProps {
    globalState: GlobalState;
    block: NodeMaterialBlock;
}
