import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import { t } from 'i18next';
import TabButton from './TabButton';
import { atom, useAtom } from 'jotai';
import React from 'react';
import joysamText from '@/assets/joysam.json';

export type TabInfo = {
    id: number;
    nameId: string;
    hashTags: string[];
    isWhole?: boolean;
    color: string;
    gradeColor: string;
};

export const CATEGORY = '131115';

export const tabList: TabInfo[] = [
    {
        id: 1,
        nameId: 'GCM.000008',
        hashTags: ['HTC_JOYSAM00101', 'HTC_JOYSAM00102', 'HTC_JOYSAM00103'],
        isWhole: true,
        color: '#fff',
        gradeColor: '#fff',
    },
    {
        id: 2,
        nameId: joysamText["JOY.000005"],
        hashTags: ['HTC_JOYSAM00101'],
        color: '#fffcec',
        gradeColor: 'rgba(253, 208, 0, 0.50)',
    },
    {
        id: 3,
        nameId: joysamText["JOY.000006"],
        hashTags: ['HTC_JOYSAM00102'],
        color: '#ebf1ff',
        gradeColor: 'rgba(142, 201, 255, 0.50)',
    },
    {
        id: 4,
        nameId: joysamText["JOY.000007"],
        hashTags: ['HTC_JOYSAM00103'],
        color: '#fff6f9',
        gradeColor: 'rgba(255, 33, 100, 0.50)',
    },
];

export const currentTabAtom = atom(1);

type TabProps = {

};

const Tab = ({ }: TabProps) => {
    const [currentTab, setCurrentTab] = useAtom(currentTabAtom);

    React.useEffect(() => {
        setCurrentTab(1);
    }, []);

    const onTouch = (id: number) => {
        console.log('onTouch', id);
        setCurrentTab(id);
    }

    const listItems = React.useMemo(() => {
        return tabList.map((tab) => {
            return (<TabButton key={tab.id} id={tab.id} nameId={tab.nameId} selected={tab.id === currentTab} onTouch={onTouch} />)
        });
    }, [currentTab]);

    return (
        <div className={style['body']}>
            <ul className={style['list']}>
                {listItems}
            </ul>
        </div>
    );
}

export default Tab;