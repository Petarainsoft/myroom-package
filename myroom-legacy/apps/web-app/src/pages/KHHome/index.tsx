import React from 'react';
import style from './style.module.scss';
import ListBody from './ListBody';
import View from '@/pages/_shared/layouts/View';
import { setMaxWidth } from '@/App';


export const KHHomeUrl: string = '/kh';

const KHHome = () => {

    React.useLayoutEffect(() => {
        setMaxWidth('750px');
    }, []);

    return (
        <View
            disableNavigation={true}
        >
            <div className={style.body}>
                <ListBody />
            </div>
        </View>
    );
};

export default KHHome;
