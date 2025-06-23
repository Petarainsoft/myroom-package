import { ItemRectCard, ItemRectPlusCard } from "@/pages/_shared/ui/Cards/ItemRectCard";
import useCoordi from "./hooks";
import React from "react";
import SelectOffCanvas from "@/pages/_shared/offcanvas/SelectOffCanvas";



type CoordiProps = {
    data: any;
}

const Coordi = ({ data}: CoordiProps) => {
    const { actions, isShowCoodiMenu, handleClickAddCoordi, handleClickCoordi, handleCloseCoordi } = useCoordi({ data });
    
    return <React.Fragment>
        {data._id === 'PLUS' ? <ItemRectPlusCard onClick={handleClickAddCoordi} max={5} count={data.count} /> : <ItemRectCard key={data._id} thumbnail={data.resource.thumbnail} onClick={handleClickCoordi}/>}
        {isShowCoodiMenu && <SelectOffCanvas isOpen={true} onClose={handleCloseCoordi} buttonList={actions} isIconButton={false} />}
    </React.Fragment>
}
export default Coordi;