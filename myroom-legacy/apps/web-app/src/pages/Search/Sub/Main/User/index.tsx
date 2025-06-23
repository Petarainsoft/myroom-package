import React from "react"
import { ProfileCard }  from '@/pages/_shared/ui/Cards/ProfileCard'
import SearchHeader from "@/pages/Search/_shared/SearchHeader";
import Container from "@/pages/_shared/layouts/Container";
import styles from "./styles.module.scss";

import { SearchSubMainProps } from "..";
const User = ({ list, onClickMore}:SearchSubMainProps) => { 
    return <React.Fragment>
        {list?.length > 0 && <section>
            <SearchHeader title={"GCM.000009"} onClick={() => onClickMore('user')} />
            <Container className={styles['container']}>
                {list?.map((data: any) => <ProfileCard key={data._id} profileId={data._id} disableDesc/>)}
            </Container>
        </section>}
    </React.Fragment>
}

export default User;