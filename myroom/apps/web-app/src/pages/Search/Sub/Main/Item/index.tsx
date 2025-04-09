import React from "react";
import styles from './styles.module.scss';
import SearchItemCard from "@/pages/_shared/ui/Cards/SearchItemCard";
import SearchHeader from "@/pages/Search/_shared/SearchHeader";
import { SearchSubMainProps } from "..";

const Item = ({ list, onClickMore }:SearchSubMainProps) => { 
    return <React.Fragment>
        {
            list?.length > 0 && <section>
                <SearchHeader title={"GCM.000011"} onClick={()=> onClickMore('item')} />
                <div className={styles['container']}>
                    {list?.map((data: any) => <SearchItemCard key={data?._id} className={styles['card']} itemId={data?._id}/>)}
                </div>
            </section>
        }
    </React.Fragment>
}

export default Item;



