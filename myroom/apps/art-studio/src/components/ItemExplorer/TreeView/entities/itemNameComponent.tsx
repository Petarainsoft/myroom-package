import type { Nullable } from "@babylonjs/core/types";
import type { Observer, Observable } from "@babylonjs/core/Misc/observable";
import type { PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { IExplorerExtensibilityGroup } from "@babylonjs/core/Debug/debugLayer";
import { GizmoManager } from "@babylonjs/core/Gizmos/gizmoManager";
import type { Scene } from "@babylonjs/core/scene";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder} from "@fortawesome/free-solid-svg-icons";

import * as React from "react";

import type { GlobalState } from "../../../globalState";

interface IItemNameComponentProps {
    itemName: string;
    selectedEntity?: any;
    onSelectionChangedObservable?: Observable<any>;
    globalState: GlobalState;
}

export class ItemNameComponent extends React.Component<IItemNameComponentProps, { isSelected: boolean }> {
    private _onSelectionChangeObserver: Nullable<Observer<any>> = null;
    private _selectedEntity: any;

    constructor(props: IItemNameComponentProps) {
        super(props);
        this.state = { isSelected: false};
    }

    componentDidMount() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        this._onSelectionChangeObserver = this.props.onSelectionChangedObservable.add((entity) => {
            this._selectedEntity = entity;
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver && this.props.onSelectionChangedObservable) {
            this.props.onSelectionChangedObservable.remove(this._onSelectionChangeObserver);
        }
    }

    shouldComponentUpdate(nextProps: IItemNameComponentProps, nextState: { isSelected: boolean }) {
        if (nextProps.selectedEntity) {
            if (nextProps.selectedEntity == "__ITEM_NAME__") {
                nextState.isSelected = true;
                return true;
            } else {
                nextState.isSelected = false;
            }
        }

        return true;
    }


    onSelect() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        this.props.onSelectionChangedObservable.notifyObservers("__ITEM_NAME__");
    }


    render() {
        return (
            <div className={this.state.isSelected ? "itemContainer selected" : "itemContainer"}>
                <div className="sceneNode">
                    <div className="sceneTitle" onClick={() => this.onSelect()}>
                        <FontAwesomeIcon icon={faFolder} />
                        &nbsp; {this.props.itemName || "모델을 로딩해 주세요" }
                    </div>
                </div>
            </div>
        );
    }
}
