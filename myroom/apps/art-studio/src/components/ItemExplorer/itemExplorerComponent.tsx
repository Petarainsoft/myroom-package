import * as BABYLON from "@babylonjs/core";
import React, { useCallback, useEffect } from "react";
import { TreeItemComponent } from "./TreeView/treeItemComponent";
import { GlobalState } from "../globalState";

import "./TreeView/treeViewCompnent.scss";
import { ItemNameComponent } from "./TreeView/entities/itemNameComponent";
import { Observable, Observer } from "@babylonjs/core";
import { IEntityInfo, ITreeViewContextMenuItem } from "../types";
import { EditorApp } from "@/core/front/editorApp";
import { ENodeMaterialType } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_Material';
import { EditorMode_ItemEditor } from "@/core/front/editorMode/editorMode_MaterialEditor";

export interface IItemExplorerDatas{
    itemName: string;
    meshes: IEntityInfo[];
    materials: IEntityInfo[];
    textures: IEntityInfo[];
}

export interface IItemExplorerComponentProps {
    globalState: GlobalState;
    data: IItemExplorerDatas;
}

const ItemExplorerComponent = (props:IItemExplorerComponentProps) => {
    const [onSelectionChangedObserver, setOnSelectionChangedObserer] = React.useState<Observer<any>|null>(null);
    const [selectedEntity, setSelectedEntity] = React.useState<any>(null);
    const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

    //컨텍스트 메뉴 만들기
    const getContextMenusMaterial = useCallback(() => {
        const defaultMenuItems: ITreeViewContextMenuItem[] = [];
        defaultMenuItems.push({
            label: "Add new Avatar material",
            action: () => {
                EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_CREATE_NEW_NODE_MATERIAL,ENodeMaterialType.Avatar);
            },
        },
        {
            label: "Add new Water material",
            action: () => {
                EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_CREATE_NEW_NODE_MATERIAL,ENodeMaterialType.Water);
            },
        }
        );

        return [...defaultMenuItems];

    },[]);

    const processKeyEvents =(e:KeyboardEvent) => {
        if(e.code === "Delete" && selectedEntity ) {
            if(selectedEntity.type === "Material"){
                if(isProcessing){
                    return;
                }

                setIsProcessing(true);
                EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_DELETE_NODE_MATERIAL, selectedEntity.name);
                setSelectedEntity(null);
                setIsProcessing(false);
            }
        }
    };


    //선택 변경 Observer 등록
    useEffect(() => {
        setOnSelectionChangedObserer(props.globalState.onSelectionChangedObservable.add((entity) => {
            if(entity && entity instanceof BABYLON.BaseTexture){
                const et = props.data.textures.find((t) => {
                    if(t.object === entity){
                        return true;
                    }
                    return false;
                });

                if(et){
                    props.globalState.onSelectionChangedObservable.notifyObservers(et); //@Hack : property grid 쪽에서 entity info를 받지 못한다. 그래서 한번더 날려준다.
                }

                return;
            }

            if(selectedEntity !== entity){
                setSelectedEntity(entity);
            }
        }));

        return () => {
            if(onSelectionChangedObserver){
                props.globalState.onSelectionChangedObservable.remove(onSelectionChangedObserver);
            }
        }
    },[selectedEntity]);

    useEffect(() => {
        //window.addEventListener("keydown", (e)=> console.log('keydown', e.code));
        window.addEventListener("keyup", (e)=> processKeyEvents(e));
        return () => {
        }
    },[selectedEntity]);


    return (
        <div id="itemExplorer">
            <div id="tree" onContextMenu={(e) => e.preventDefault()}>
                <ItemNameComponent
                    itemName ={props.data.itemName}
                    globalState={props.globalState}
                    selectedEntity={selectedEntity}
                    onSelectionChangedObservable={props.globalState.onSelectionChangedObservable}
                />
                <TreeItemComponent
                    globalState={props.globalState}
                    selectedEntity={selectedEntity}
                    items={props.data.meshes}
                    label="Meshes"
                    offset={1}
                    filter={null}
                />
                <TreeItemComponent
                    globalState={props.globalState}
                    selectedEntity={selectedEntity}
                    items={props.data.materials}
                    label="Materials"
                    offset={1}
                    filter={null}
                    contextMenuItems={getContextMenusMaterial()}
                />
                <TreeItemComponent
                    globalState={props.globalState}
                    selectedEntity={selectedEntity}
                    items={props.data.textures}
                    label="Textures"
                    offset={1}
                    filter={null}
                />
            </div>
        </div>
    );
}

export default ItemExplorerComponent;