

import User from "./User";
import Tag from "./Tag";
import Item from "./Item";
import Myroom from "./Myroom";
import styles from './styles.module.scss';
import useSearchSubMain from "./hooks";
import NotFound from "@/pages/_shared/ui/NotFound";

export type SearchSubMainProps = {
    list: any;
    onClickMore: (id:string)=>void;
}

const Main = () => { 
    const { searchItemList, searchMyroomList, searchProfileList, searchTagList, handleClickTab, isNotFound } = useSearchSubMain();

    return <div className={styles['wrap']}>
        <User list={searchProfileList} onClickMore={handleClickTab} />
        <Myroom list={searchMyroomList} onClickMore={handleClickTab}/>
        <Item list={searchItemList} onClickMore={handleClickTab}/>
        <Tag list={searchTagList} onClickMore={handleClickTab}/>
        {isNotFound && <NotFound icon="Allim_Empty1" textId="GSC.000003"/>}
    </div>
}

export default Main;