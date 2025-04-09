import style from './style.module.scss';
import Text from '@/components/Text';
import { t } from 'i18next';
import { atom, useAtomValue } from 'jotai';
import React from 'react';
import { currentTabAtom } from '../Tab';
import useItemAPI from "@/apis/Meta/Item";
import { tabList, CATEGORY } from '../Tab';
import ListItem from './ListItem';
import { WORLD_ID } from "@/common/constants";
import { EItemCategory2 } from "client-core";
import { LANG } from "@/pages/Joysam";
import useModal from '@/common/hooks/Modal/useModal';

type ListBodyProps = {

};

const ListBody = ({ }: ListBodyProps) => {
    const currentTab = useAtomValue(currentTabAtom);

    const itemList = useItemAPI().fetchItems({
        w: WORLD_ID,
        category: CATEGORY,
    }).data?.list;

    const JoysamModelInfoModal = useModal('JoysamModelInfoModal');

    const onTouch = (id: string) => {
        console.log('onTouch', id);
        JoysamModelInfoModal.createModal({
            itemId: id,
        });
    }

    console.log("ListBody - itemList", itemList);

    const listItems = React.useMemo(() => {
        return itemList && itemList.map((item) => {
            const system_hashtag = item?.txt.system_hashtag;

            const curTab = tabList.find((tab) => tab.id === currentTab);
            if (!curTab) return null;

            // 현재 tab과 관련된 hashtag를 가진것만 걸러낸다.
            let ok = false;
            curTab.hashTags.forEach((hashTag) => {
                if (system_hashtag && system_hashtag.includes(hashTag)) ok = true;
            });
            if (!ok) return null;

            const tabData = tabList.find((tab) => {
                if (tab.hashTags.length > 1) return false;
                return system_hashtag && system_hashtag.includes(tab.hashTags[0]);
            });
            const name = item.txt.title ? item.txt.title[LANG] : '';
            const desc = item.txt.desc ? item.txt.desc[LANG] : '';
            return (<ListItem
                key={item._id}
                id={item._id}
                name={name}
                categoryNameId={tabData?.nameId ?? ''}
                thumbnail={item.resource.thumbnail}
                backColor={tabData?.color}
                gradeColor={tabData?.gradeColor}
                onTouch={onTouch}
            />)
        });
    }, [currentTab, itemList]);

    return (
        <div className={style['body']}>
            <ul className={style['list']}>
                {listItems}
            </ul>
        </div>
    );
}

export default ListBody;