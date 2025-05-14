import * as BABYLON from '@babylonjs/core';
import React ,{useCallback,useEffect} from 'react';
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';
import { GlobalState } from "../globalState";
import MeshPropertyGridComponent from './GridComponents/meshPropertyGridComponent';
import { Mesh, NodeMaterial, Observable, Observer, PBRMaterial, StandardMaterial } from '@babylonjs/core';
import "./propertyGrid.scss";
import { PBRMaterialPropertyGridComponent } from './GridComponents/pbrMaterialPropertyGridComponent';
import { StandardMaterialPropertyGridComponent } from './GridComponents/standardMaterialPropertyGridComponent';
import { IUsingMaterialInfo } from '@/core/front/editorMode/modelController';
import { NodeMaterialPropertyGridComponent } from './GridComponents/nodeMaterialPropertyGridComponent';
import { TexturePropertyGridComponent } from './GridComponents/texturePropertyGridComponent';

interface IPropertyTabProps {
    lockObject: LockObject;
    globalState: GlobalState;
}

const PropertyGrid = (props:IPropertyTabProps) => {
    const [onSelectionChangedObserver, setOnSelectionChangedObserer] = React.useState<Observer<any>|null>(null);
    const [selectedEntity, setSelectedEntity] = React.useState<any>(null);

    //선택 변경 Observer 등록
    useEffect(() => {
        setOnSelectionChangedObserer(props.globalState.onSelectionChangedObservable.add((entity) => {
            if(entity && entity instanceof BABYLON.BaseTexture){
                return; //메터리얼에서 texture ping 할경우 무시해야한다.!!!
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



    const renderContent = useCallback(()=>{
        const entity = selectedEntity;
        if(!entity){
            return (<div className="infoMessage">Item Explorer에서 Entity를 선택해 주세요.</div>);
        } 

        if(entity.type === "Mesh"){
            const mesh = entity.object as Mesh;
            return (
                <div>
                    <MeshPropertyGridComponent
                        mesh={mesh}
                        lockObject={props.lockObject}
                    />
                </div>
            )
        }

        if(entity.type === "Material"){

            const materialInfo = entity.object as IUsingMaterialInfo;
            if(materialInfo){

                if(materialInfo.material.getClassName() === "NodeMaterial"){
                    const material = materialInfo.material as NodeMaterial;
                    return (
                        <div>
                            <NodeMaterialPropertyGridComponent
                                globalState={props.globalState}
                                material={material}
                                lockObject={props.lockObject}
                                onSelectionChangedObservable={props.globalState.onSelectionChangedObservable}
                                onTextureAddedObservable={()=>{props.globalState.onForceRefreshUIObservable.notifyObservers()}}
                            />
                        </div>
                    )
                }


                if(materialInfo.material.getClassName() === "PBRMaterial"){
                    const material = materialInfo.material as PBRMaterial;
                    return (
                        <div>
                            <PBRMaterialPropertyGridComponent
                                globalState={props.globalState}
                                material={material}
                                lockObject={props.lockObject}
                            />
                        </div>
                    )
                }

                if(materialInfo.material.getClassName() === "StandardMaterial"){
                    const material = materialInfo.material as StandardMaterial;
                    return (
                        <div>
                            <StandardMaterialPropertyGridComponent
                                globalState={props.globalState}
                                material={material}
                                lockObject={props.lockObject}
                            />
                        </div>
                    )
                }
            }
        }

        if(entity.type === "Texture"){
            const texture = entity.object as BABYLON.Texture;
            return (
                <div>
                    <TexturePropertyGridComponent
                        globalState={props.globalState}
                        texture={texture}
                        lockObject={props.lockObject}
                        onTextureChagnedObservable={()=>{
                            props.globalState.onForceRefreshUIObservable.notifyObservers()
                        }}
                    />
                </div>
            )
        }

    },[selectedEntity]);

    return (
        <div className="propertyGrid">
            {renderContent()}
        </div>
    );
};

export default PropertyGrid;