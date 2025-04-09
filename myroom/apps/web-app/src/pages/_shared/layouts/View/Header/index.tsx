import CircleButton from "@/components/Buttons/CircleButton";
import Container from "../../Container";
import styles from "./styles.module.scss";
import Icon from "@/components/Icon";
import classNames from "classnames";
import React from "react";


export type HeaderProps = {
    float?: boolean;
    startArea?: React.ReactNode;
    centerArea?:React.ReactNode;
    endArea?: React.ReactNode;
    closeOptions: {
        disabled?: boolean;
        icon: "arrow" | "x";
        onClick?: () => void;
    };
}

const Header = ({ float = false, startArea, centerArea, endArea, closeOptions }: HeaderProps) => {
    return <Container className={classNames(styles['wrap'], {[styles['float']]: float})}>
        <div className={classNames(styles['container'], styles['start'])}>
            {!closeOptions.disabled && <CircleButton className={styles['close']} size={"s"} shape={float ? "circle" : 'none'} onClick={closeOptions.onClick}>
                    <Icon name={closeOptions.icon === 'arrow' ? (float? "Top_Arrow_left_S" : "Top_Arrow_left_M") : (float? "Close_Bottom_S" : "Top_Close")} />
                </CircleButton>}
            <div className={classNames(styles['container'], styles['start'])}>
                {startArea}
            </div>
        </div>
        <div  className={classNames(styles['container'], styles['center'])}>
            {centerArea}
        </div>
        <div className={classNames(styles['container'], styles['end'])}>
            {endArea}
        </div>
    </Container>
}

export default Header;