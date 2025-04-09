import * as BABYLON from '@babylonjs/core';
import React ,{useCallback,useEffect, useState} from 'react';
import { LineContainerComponent } from 'client-tools-ui-components/lines/lineContainerComponent';
import { TextLineComponent } from 'client-tools-ui-components/lines/textLineComponent';
import { useAtom } from 'jotai';
import { equipStateAtom } from '../../core/front/stores';
import EquipInfoLineComponent from './lines/equipInfoLineComponent';
import StatusAniLineComponent from './lines/statusAniLineComponent';
import { EditorApp } from '@/core/front/editorApp';
import { EditorMode_EquipEditor } from '@/core/front/editorMode/editorMode_EquipEditor';
import "./EquipProperty.scss";
import { AvatarController } from 'client-core';
import { Color3LineComponent } from 'client-tools-ui-components/lines/color3LineComponent';
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';

export interface IEquipPropertyProps {
    lockObject: LockObject;
}

const EquipProperty = (props:IEquipPropertyProps) => {
    const [equipState, setEquipState] = useAtom(equipStateAtom);
    const [uiCustomizationData, setUiCustomizationDataState] = useState({
        hairColor: BABYLON.Color3.FromHexString(equipState.customization.hairColor),
        skinColor: BABYLON.Color3.FromHexString(equipState.customization.skinColor),
    });

    React.useEffect(() => {
        const interval = setInterval(() => {
            const editor = EditorApp.getInstance();
            if(editor){
                const editorMode = editor.getCurrentEditorMode() as EditorMode_EquipEditor;
                if(editorMode){
                    const newEquipState = editorMode.getUIData();
                    if(newEquipState){
                        setEquipState(preState => ({... newEquipState}));
                        setUiCustomizationDataState(
                            preState=>({... {
                                hairColor : BABYLON.Color3.FromHexString(newEquipState.customization.hairColor),
                                skinColor : BABYLON.Color3.FromHexString(newEquipState.customization.skinColor),
                            }})
                        )
                    }
                }
            }

        }, 300);
        return () => clearInterval(interval);
      }, []);

    const playAni = useCallback((aniName:string)=>{
        const editor = EditorApp.getInstance();
        if(editor){
            editor.executeCommand(EditorMode_EquipEditor.EDITOR_COMMAND_PLAY_ANI,aniName);
        }
    },[]);

    const unequipItem = useCallback((itemName:string)=>{
        const editor = EditorApp.getInstance();
        if(editor){
            editor.executeCommand(EditorMode_EquipEditor.EDITOR_COMMAND_UNEQUIP_ITEM,itemName);
        }

    },[]);

    const setSkinColor = useCallback((skinColor:BABYLON.Color3)=>{
        const editor = EditorApp.getInstance();
        if(editor){
            editor.executeCommand(EditorMode_EquipEditor.EDITOR_COMMAND_SET_SKINCOLOR,skinColor.toHexString());
        }

    },[]);

    const setHairColor = useCallback((hairColor:BABYLON.Color3)=>{
        const editor = EditorApp.getInstance();
        if(editor){
            editor.executeCommand(EditorMode_EquipEditor.EDITOR_COMMAND_SET_HAIRCOLOR,hairColor.toHexString());
        }

    },[]);

    const renderContent = useCallback(()=>{
        return (
            <div>
                <div className = "panes">
                    <div className = "pane">
                        <LineContainerComponent title="장착 아이템" closed = {false}>
                            {equipState.equipment.map((equip) => {
                                return <EquipInfoLineComponent slotName = {equip.slot} itemName={equip.item} onBtnClick={(itemName)=>{unequipItem(itemName);}} />
                            })}
                        </LineContainerComponent>
                        <LineContainerComponent title="에니메이션" closed = {false}>
                            {equipState.animation.map((ani) => {
                                return <StatusAniLineComponent  aniName={ani} onBtnClick={(aniName)=>{playAni(aniName)}} />
                            })}
                        </LineContainerComponent>
                        <LineContainerComponent title="Customization" closed = {false}>
                            <Color3LineComponent
                                label="Skin Color"
                                target={uiCustomizationData}
                                propertyName="skinColor"
                                lockObject={props.lockObject}
                                onChange={()=>{setSkinColor(uiCustomizationData.skinColor);}}
                            />
                            <Color3LineComponent
                                label="Hair Color"
                                target={uiCustomizationData}
                                propertyName="hairColor"
                                lockObject={props.lockObject}
                                onChange={()=>{setHairColor(uiCustomizationData.hairColor);}}
                            />
                        </LineContainerComponent>
                    </div>
                </div>
            </div>

      );
    },[equipState]);

    return (
        <div className="propertyGrid">
            {renderContent()}
        </div>
    );
};

export default EquipProperty;