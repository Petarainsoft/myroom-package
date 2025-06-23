import style from './style.module.scss';
import Text from '@/components/Text';
import { t } from 'i18next';
import { atom, useAtomValue } from 'jotai';
import React from 'react';
import useItemAPI from "@/apis/Meta/Item";
import { tabList, CATEGORY } from '../../JoysamModelListModal/Tab';
import ListItem from './ListItem';
import { WORLD_ID } from "@/common/constants";
import { LANG } from "@/pages/Joysam";

type ListBodyProps = {
    onTouchItem: (id: string) => void;
};

const ListBody = ({ onTouchItem }: ListBodyProps) => {

    const itemList = useItemAPI().fetchItems({
        w: WORLD_ID,
        category: CATEGORY,
    }).data?.list;

    const onTouch = (id: string) => {
        console.log('onTouch', id);
        onTouchItem(id);
    }

    console.log("ListBody - itemList", itemList);

    const listItems = React.useMemo(() => {
        return itemList && itemList.map((item) => {
            const system_hashtag = item.txt.system_hashtag;

            const curTab = tabList[0];

            // 현재 tab과 관련된 hashtag를 가진것만 걸러낸다.
            let ok = false;
            curTab.hashTags.forEach((hashTag) => {
                if (system_hashtag && system_hashtag.includes(hashTag)) ok = true;
            });
            if (!ok) return null;

            return (<ListItem key={item._id} id={item._id} thumbnail={item.resource.thumbnail} onTouch={onTouch} />)
        });
    }, [itemList]);

    return (
        <div className={style['body']}>
            <ul className={style['list']}>
                {listItems}
            </ul>
        </div>
    );
}

export default ListBody;