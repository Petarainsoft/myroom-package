import React from 'react';
import { useAtom } from 'jotai';
import {LineContainerComponent} from 'client-tools-ui-components/lines/lineContainerComponent'
import { FloatLineComponent } from 'client-tools-ui-components/lines/floatLineComponent';
import "./propertyTab.scss";
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';
import { iconSettingAtom } from '@/common/stores';
import { SliderLineComponent } from 'client-tools-ui-components/lines/sliderLineComponent';
import { ButtonLineComponent } from 'client-tools-ui-components/lines/buttonLineComponent';
import { OptionsLineComponent } from 'client-tools-ui-components/lines/optionsLineComponent';
import { ItemModelIconGenerator } from '@/common/itemModelIconGenerator';



interface IPropertyTabProps {
    lockObject: LockObject;
}

const PropertyTab = (prop:IPropertyTabProps) => {
    const [iconSetting, setIconSetting] = useAtom(iconSettingAtom);

    const iconSizeOptions = [
        { label: "256", value: 256 },
        { label: "512", value: 512 },
        { label: "1024", value: 1024 },
    ]

    return (
        <div id = "propertyTab" className='propertyTab'>
            <div id="header">
                    <div id="title">ICON GENERATOR</div>
            </div>
            <div>
            <LineContainerComponent title='아이콘 설정'>
                <SliderLineComponent
                    lockObject={prop.lockObject}
                    label="Alpha"
                    useEuler={false}
                    target={iconSetting}
                    propertyName="alpha"
                    minimum={0}
                    maximum={2 * Math.PI}
                    step={0.01}
                    onChange={(newValue)=> {
                        setIconSetting(pre => ({...pre, alpha:newValue}));
                }}/>
                <SliderLineComponent
                    lockObject={prop.lockObject}
                    label="Beta"
                    useEuler={false}
                    target={iconSetting}
                    propertyName="beta"
                    minimum={0}
                    maximum={2 * Math.PI}
                    step={0.01}
                    onChange={(newValue)=> {
                        setIconSetting(pre => ({...pre, beta:newValue}));
                }}/>
                <FloatLineComponent
                    lockObject={prop.lockObject}
                    label="Radius"
                    target={iconSetting}
                    propertyName="radius"
                    onChange={(newValue)=> {
                        setIconSetting(pre => ({...pre, radius:newValue}));
                }}/>
                <SliderLineComponent
                    label='FOV'
                    minimum={1}
                    maximum={89}
                    step={1}
                    decimalCount={0}
                    target={iconSetting}
                    propertyName='fov'
                    lockObject={prop.lockObject}
                    onChange={(newValue)=> {
                        setIconSetting(pre => ({...pre, fov:newValue}));
                }}/>
                <OptionsLineComponent
                    label="Icon Size"
                    options={iconSizeOptions}
                    target={iconSetting}
                    propertyName="iconSize"
                    onSelect={(newValue) => {
                        setIconSetting(pre => ({...pre, iconSize:newValue as number}));
                }}/>
                <ButtonLineComponent
                    label="아이콘 찍기"
                    onClick={() => {
                        ItemModelIconGenerator.getInstance().takeScreenshotFromUI();
                    }}
                />
                <ButtonLineComponent
                    label="아이콘 폴더 열기"
                    onClick={() => {
                        ItemModelIconGenerator.getInstance().openIconFolder();
                    }}
                />
            </LineContainerComponent>
            </div>
        </div>
    );
};

export default PropertyTab;