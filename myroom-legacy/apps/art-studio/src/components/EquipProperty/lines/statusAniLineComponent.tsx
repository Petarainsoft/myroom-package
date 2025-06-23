import { AvatarController } from 'client-core';
import React from 'react';

export interface IStatusAniLineComponentProps {
    aniName:string
    onBtnClick: (aniName:string)=> void;
}

const StatusAniLineComponent = (props:IStatusAniLineComponentProps) => {
    return (
        <div className="statusAniLine">
            <div className="aniName">{props.aniName||"Skeleton Idle"}</div>
            <button className="btn"onClick={()=>{props.onBtnClick(props.aniName);}}>Play</button>
        </div>
    );
}

export default StatusAniLineComponent;