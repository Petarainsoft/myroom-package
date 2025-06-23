import React, { useCallback } from 'react';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';
import { LineContainerComponent } from 'client-tools-ui-components/lines/lineContainerComponent';
import { TextLineComponent } from 'client-tools-ui-components/lines/textLineComponent';
import { OptionsLineComponent } from "client-tools-ui-components/lines/optionsLineComponent";
import { ButtonLineComponent } from 'client-tools-ui-components/lines/buttonLineComponent';
import { EditorApp } from '@/core/front/editorApp';
import { EditorMode_ItemEditor } from '@/core/front/editorMode/editorMode_MaterialEditor';
import { ModelController_MaterialEditor } from '@/core/front/editorMode/modelController';

interface IMeshPropertyGridComponentProps {
    mesh: BABYLON.AbstractMesh;
    lockObject: LockObject;
}

const MeshPropertyGridComponent = (props:IMeshPropertyGridComponentProps) => {

    //메터리얼 옵션 만들기
    const makeMaterialOptions = useCallback(() => {
        const modelController = EditorApp.getInstance().getModelController<ModelController_MaterialEditor>();
        if(modelController){
            const materialInfos = modelController.getAllUsingMaterialInfos();
            const materialOptions = materialInfos.map((m, i) => {
                return {
                    label: m.material.name || "no name",
                    value: i,
                };
            });

            materialOptions.splice(0, 0, {
                label: "None (Default Fallback)",
                value: -1,
            });

            return materialOptions;
        }

        return [];
    },[]);

    //모든 메터리얼
    const getAllMaterials = useCallback(()=>{
        const modelController = EditorApp.getInstance().getModelController<ModelController_MaterialEditor>();
        if(modelController){
            return modelController.getAllUsingMaterialInfos();
        }
        return [];
    },[]);


    return (
        <div className = "panes">
            <div className = "pane">
                <LineContainerComponent title="GENERAL" >
                    <TextLineComponent label="Name" value={props.mesh.name} />
                    {!props.mesh.isAnInstance && (
                        <OptionsLineComponent
                            label="메터리얼"
                            options={makeMaterialOptions()}
                            target={props.mesh}
                            propertyName="material"
                            noDirectUpdate={true}
                            onSelect={(value) => {
                                const modelController = EditorApp.getInstance().getModelController<ModelController_MaterialEditor>();
                                if(modelController){
                                    const meshPath = modelController.makeMeshPath(props.mesh);
                                    if(value === -1){
                                        EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_ASSIGN_MATERIAL, meshPath, "");
                                    }
                                    else{
                                        const materialName = getAllMaterials()[value as number].name;
                                        EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_ASSIGN_MATERIAL, meshPath, materialName);
                                    }
                                }
                                else{
                                    console.error("MeshPropertyGridComponent : 모델 컨트롤러가 없습니다.");
                                }
                            }}
                            extractValue={() => (props.mesh.material ? getAllMaterials().findIndex( (info)=> info.material === props.mesh.material) : -1)}
                        />
                    )}
                    <ButtonLineComponent label='Create Clone Material' onClick={()=>{
                        const modelController = EditorApp.getInstance().getModelController<ModelController_MaterialEditor>();
                        if(modelController){
                            const meshPath = modelController.makeMeshPath(props.mesh);
                            EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_CREATE_CLONE_MATERIAL, meshPath);
                        }
                        else{
                            console.error("MeshPropertyGridComponent : 모델 컨트롤러가 없습니다.");
                        }
                    }} />
                </LineContainerComponent>
            </div>
        </div>
  );
}

export default MeshPropertyGridComponent;
