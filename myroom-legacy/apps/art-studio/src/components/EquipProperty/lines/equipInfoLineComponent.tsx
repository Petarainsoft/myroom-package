import { AvatarController } from 'client-core';
import React from 'react';

export interface IEquipInfoLineComponentProps {
    slotName: string;
    itemName: string;
    onBtnClick: (slotName:string)=> void;
}

const EquipInfoLineComponent = (props:IEquipInfoLineComponentProps) => {
    return (
        <div className="equipInfoLine">
            <div className="slotName">{props.slotName}</div>
            <div className="itemName">{props.itemName}</div>
            {(props.slotName === "장신구" || props.slotName ==="코스튬") ?<button className="btn" onClick={()=>{props.onBtnClick(props.itemName);}}>해제</button> : null}
        </div>
    );
}

export default EquipInfoLineComponent;