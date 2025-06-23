import style from './style.module.scss';
import Text from '@/components/Text';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import React from 'react';
import ListItem from './ListItem';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/common/utils/auth';
import useAuth from "@/common/hooks/use-auth";

type ListBodyProps = {

};

class ItemData {
    id: string = '';
    name: string = '';
    desc: string = '';
    color: string = '';
    categoryName: string = '';
    gradeColor: string = '';
    icon: string = '';
    url: string = '';
}

const itemList: ItemData[] = [
    {
        id: '1',
        name: '로비로 이동',
        desc: '투개더의 모든 서비스를 한 눈에 만나보세요.',
        color: '#fffcec',
        categoryName: '공간',
        gradeColor: 'rgba(253, 208, 0, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/1szb48shTGCA1Mcg1PmBE/8/thumbnail.png',
        url: '/khlobby',
    },
    {
        id: '2',
        name: '피트니스 센터로 이동',
        desc: '오늘은 어떤 운동을 해볼까요?',
        color: '#fffcec',
        categoryName: '공간',
        gradeColor: 'rgba(253, 208, 0, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/1szb48shTGCA1Mcg1PmBE/8/thumbnail.png',
        url: '/khfitness',
    },
    {
        id: '3',
        name: '마인드케어 센터로 이동',
        desc: '다친 마음을 치료해드려요.',
        color: '#fffcec',
        categoryName: '공간',
        gradeColor: 'rgba(253, 208, 0, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/1szb48shTGCA1Mcg1PmBE/8/thumbnail.png',
        url: '/khtherapy',
    },
    {
        id: '4',
        name: '이너힐링 1 - 자기 위안',
        desc: '지친 마음을 편안하게 달래는 방법을 알려드려요.',
        color: '#ebf1ff',
        categoryName: '힐링',
        gradeColor: 'rgba(142, 201, 255, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/3lz4z1AnVIgw6t5sZDaNM/7/thumbnail.png',
        url: '/joysam-dialog-test?dialogId=HC01',
    },
    {
        id: '5',
        name: '이너힐링 2 - 긍정 경험',
        desc: '긍정적인 경험들을 쌓아 행복하게 하는 방법을 알려드려요.',
        color: '#ebf1ff',
        categoryName: '힐링',
        gradeColor: 'rgba(142, 201, 255, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/3lz4z1AnVIgw6t5sZDaNM/7/thumbnail.png',
        url: '/joysam-dialog-test?dialogId=HC02',
    },
    {
        id: '6',
        name: '1:1상담 (남)',
        desc: '아바타를 통한 부담없는 상담을 경험해보세요.',
        color: '#fff6f9',
        categoryName: '상담',
        gradeColor: 'rgba(255, 33, 100, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/5eycQLXfpXJIGlMAZDjiS/9/thumbnail.png',
        url: '/khconv?guest=1',
    },
    {
        id: '7',
        name: '1:1상담 (여)',
        desc: '아바타를 통한 부담없는 상담을 경험해보세요.',
        color: '#fff6f9',
        categoryName: '상담',
        gradeColor: 'rgba(255, 33, 100, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/5eycQLXfpXJIGlMAZDjiS/9/thumbnail.png',
        url: '/khconv?guest=2',
    },
    {
        id: '8',
        name: '1:1상담 (남) slow',
        desc: '인터넷/기기 환경이 좋지 않다면 slow를 사용해보세요.',
        color: '#fff6f9',
        categoryName: '상담',
        gradeColor: 'rgba(255, 33, 100, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/5eycQLXfpXJIGlMAZDjiS/9/thumbnail.png',
        url: '/khconv?guest=1&period=200',
    },
    {
        id: '9',
        name: '1:1상담 (여) slow',
        desc: '인터넷/기기 환경이 좋지 않다면 slow를 사용해보세요.',
        color: '#fff6f9',
        categoryName: '상담',
        gradeColor: 'rgba(255, 33, 100, 0.50)',
        icon: 'https://resource.dev.colorver.se/meta/item/5eycQLXfpXJIGlMAZDjiS/9/thumbnail.png',
        url: '/khconv?guest=2&period=200',
    },
];

const ListBody = ({ }: ListBodyProps) => {

    const navigate = useNavigate();

    const { signin, isLogined, signout } = useAuth();

    const onTouch = (id: string) => {
        console.log('onTouch', id);
        const itemData = itemList.find((item) => item.id === id);
        if (itemData) {
            auth.clearCredential();
            signout();
            navigate(itemData.url);
        }
    }

    const listItems = React.useMemo(() => {
        return itemList && itemList.map((item) => {

            return (<ListItem
                key={item.id}
                id={item.id}
                name={item.name}
                desc={item.desc}
                thumbnail={item.icon}
                backColor={item.color}
                categoryName={item.categoryName}
                gradeColor={item.gradeColor}
                onTouch={onTouch}
            />)
        });
    }, [itemList]);

    return (
        <div className={style.body}>
            <ul className={style.list}>
                {listItems}
            </ul>
        </div>
    );
}

export default ListBody;