import View from "../_shared/layouts/View"
import InputText from "@/components/Forms/InputText";
import useSearchPage from "./hooks";
import styles from "./styles.module.scss";
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import React from "react";
import { t } from "i18next";
import Form from "@/components/Forms/Form";
import Sub from "./Sub";
import Home from "./Home";

const SearchPage = () => {
    const {  inputRef, query, searchText,  handleChangeSearchText, handleClickClose, handleClickResetSearchText, handleSubmit} = useSearchPage();

    return <View fixed className={styles['wrap']}
        headerOptions={{
            startArea: <div className={styles['search-wrap']}>
                <Form onSubmit={handleSubmit}>
                    <InputText variant={'default'} ref={inputRef} type={"text"} onChange={handleChangeSearchText} value={searchText} placeholder={t('GSC.000001')} />
                    {searchText.length > 1 && <CircleButton className={styles['reset']} onClick={handleClickResetSearchText} size={"xxs"}><Icon name="Close_Bottom_S" /></CircleButton>}
                </Form>
            </div>,
            closeOptions: {
                icon: "arrow",
                onClick: handleClickClose,
            }
        }}>
        <React.Fragment>
            {!query? <Home /> : <Sub />}
        </React.Fragment>
    </View>
}

export default SearchPage;
