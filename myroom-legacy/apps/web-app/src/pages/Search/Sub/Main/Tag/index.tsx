import React from "react"
import TagCard from "@/pages/_shared/ui/Cards/TagCard";
import SearchHeader from "@/pages/Search/_shared/SearchHeader";
import Container from "@/pages/_shared/layouts/Container";
import styles from './styles.module.scss';
import { SearchSubMainProps } from "..";


const Tag = ({ list, onClickMore}:SearchSubMainProps) => { 
    return <React.Fragment>
        {
            list?.length > 0 && <section>
                   <SearchHeader title={"GCM.000012"} onClick={()=> onClickMore('tag')} />
                    <Container className={styles['container']}>
                         {list?.map((data: any) => data && <TagCard key={data?.ht_code} className={styles['card']} hashtag={data?.hashtag} htCode={data?.ht_code} itemCount={data?.count?.item} pingCount={data?.count?.ping} />)}
                    </Container>    
            </section>
        }
    </React.Fragment>
}

export default Tag;