import React from "react";
import Text from "@/components/Text";
import CustomButton from "@/components/Buttons/CustomButton";
import styles from './styles.module.scss';
import Icon from "@/components/Icon";
import Container from "@/pages/_shared/layouts/Container";

type HeaderProps = {
    title: string;
    onClick?: () => void;
}

const SearchHeader = ({ title, onClick}:HeaderProps) => { 
    return <Container className={styles['wrap']}>
        <Text locale={{ textId: title }} />
       <CustomButton className={styles['more']} onClick={onClick}>
            <Text locale={{ textId: "GCM.000013" }} />
            <Icon className={styles['icon']}  name="Arrow_Right_SS"/>
        </CustomButton>
    </Container>
}

export default SearchHeader;