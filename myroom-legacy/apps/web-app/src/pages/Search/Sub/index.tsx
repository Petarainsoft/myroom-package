import useSearch from "@/common/hooks/use-search";
import Switcher from "@/pages/_shared/layouts/Switcher";
import Tabs from "@/pages/_shared/layouts/Tabs";
import React from "react";
import Main from "./Main";
import User from "./User";
import Myroom from "./Myroom";
import Item from "./Item";
import Tag from "./Tag";

const Sub = () => {
    const { keyword, handleClickTab } = useSearch();
    return <React.Fragment>
         <Tabs elements={[{ textId: "GCM.000008", onClick: () => handleClickTab(), selected: keyword === undefined },
                                { textId: "GCM.000009", onClick: () => handleClickTab('user'), selected: keyword === 'user' },
                                { textId: "GCM.000010", onClick: () => handleClickTab('myroom'), selected: keyword === 'myroom' },
                                { textId: "GCM.000011", onClick: () => handleClickTab('item'),  selected: keyword === 'item' },
            { textId: "GCM.000012", onClick: () => handleClickTab('tag'), selected: keyword === 'tag' }]} />
        <Switcher status={keyword} elements={[
            { status: undefined, element: <Main /> },
            { status: 'user', element: <User /> },
            { status: 'myroom', element: <Myroom /> },
            { status: 'item', element: <Item /> },
            { status : 'tag', element :<Tag />},
        ]} />
    </React.Fragment>
}

export default Sub;