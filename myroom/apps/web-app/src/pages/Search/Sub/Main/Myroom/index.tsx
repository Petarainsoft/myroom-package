import React from "react";
import SearchRoomCard from "@/pages/Search/_shared/SearchRoomCard";
import SearchHeader from "@/pages/Search/_shared/SearchHeader";

import styles from './styles.module.scss';
import { SearchSubMainProps } from "..";


const Myroom = ({ list, onClickMore }:SearchSubMainProps) => { 
    
    return <React.Fragment>
        {
            list?.length > 0 && <section>
                <SearchHeader title={"GCM.000010"} onClick={() => onClickMore('myroom')} />
                <div className={styles['container']}>
                    {list?.map((data: any) => <SearchRoomCard key={data._id} className={styles['card']} id={data._id} />)}
                </div>
            </section>
        }
    </React.Fragment>
}

export default Myroom;