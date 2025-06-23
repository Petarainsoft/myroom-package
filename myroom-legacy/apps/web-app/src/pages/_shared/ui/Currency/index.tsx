import Icon from "@/components/Icon";
import { useMemo } from "react";

type CurrencyProps = {
    className?: string;
    type: number;
}

const Currency = ({ className, type }: CurrencyProps) => {
    const name = useMemo(() => { 
        switch (type) {
            case 4:
                return "Money_Diamond_SS";
            default:
                return "Money_Cube_SS";
        }   
    }, [type]);

    return <Icon name={name} className={className} />
}

export default Currency;