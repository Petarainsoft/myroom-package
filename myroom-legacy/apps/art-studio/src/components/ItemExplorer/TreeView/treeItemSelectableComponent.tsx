import type { Nullable } from "@babylonjs/core/types";

import { TreeItemSpecializedComponent } from "./treeItemSpecializedComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Tools } from "./tools";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { GlobalState } from "../../globalState";
import { IEntityInfo } from "@/components/types";

export interface ITreeItemSelectableComponentProps {
    entity: IEntityInfo;
    selectedEntity?: IEntityInfo;
    mustExpand?: boolean;
    offset: number;
    globalState: GlobalState;
    filter: Nullable<string>;
}

export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, { isExpanded: boolean; isSelected: boolean }> {
    private _wasSelected = false;
    private myRef: React.RefObject<HTMLDivElement>;

    constructor(props: ITreeItemSelectableComponentProps) {
        super(props);
        this.myRef = React.createRef();
        this.state = {
            isSelected: this.props.entity === this.props.selectedEntity,
            isExpanded: this.props.mustExpand || Tools.LookForItem(this.props.entity, this.props.selectedEntity),
        };
    }

    switchExpandedState(): void {
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: { isExpanded: boolean; isSelected: boolean }) {
        if (!nextState.isExpanded && this.state.isExpanded) {
            return true;
        }

        if (nextProps.selectedEntity) {
            if (nextProps.entity === nextProps.selectedEntity) {
                nextState.isSelected = true;
                return true;
            } else {
                nextState.isSelected = false;
            }

            if (Tools.LookForItem(nextProps.entity, nextProps.selectedEntity)) {
                nextState.isExpanded = true;
                return true;
            }
        }

        return true;
    }

    scrollIntoView() {
        //const element = ReactDOM.findDOMNode(this) as Element;
        const element = ReactDOM.findDOMNode(this.myRef.current) as Element;

        if (element) {
            element.scrollIntoView(false);
        }
    }

    componentDidMount() {
        if (this.state.isSelected) {
            this.scrollIntoView();
        }
    }

    componentDidUpdate() {
        if (this.state.isSelected && !this._wasSelected) {
            this.scrollIntoView();
        }
        this._wasSelected = false;
    }

    onSelect() {
        if (!this.props.globalState.onSelectionChangedObservable) {
            return;
        }
        this._wasSelected = true;
        const entity = this.props.entity;
        this.props.globalState.onSelectionChangedObservable.notifyObservers(entity);
    }

    render() {
        const marginStyle = {
            paddingLeft: 10 * (this.props.offset + 0.5) + "px",
        };
        const entity = this.props.entity;

        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;
        if (!entity.reservedDataStore) {
            entity.reservedDataStore = {};
        }

        entity.reservedDataStore.setExpandedState = (value: boolean) => {
            this.setState({ isExpanded: value });
        };
        entity.reservedDataStore.isExpanded = this.state.isExpanded;

        return (
            <div>
                <div className={this.state.isSelected ? "itemContainer selected" : "itemContainer"} style={marginStyle}>
                    <TreeItemSpecializedComponent
                        globalState={this.props.globalState}
                        label={entity.name}
                        entity={entity}
                        onClick={() => this.onSelect()}
                    />
                </div>
            </div>
        );
    }
}
