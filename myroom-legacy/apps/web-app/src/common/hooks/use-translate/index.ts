import { useCallback } from "react";
import { t as translate, TOptionsBase, InterpolationMap } from "i18next";
import replace from 'lodash/replace'
type $Dictionary<T = unknown> = { [key: string]: T };

const useTranslate = () => {
    const t = useCallback((key: string, options?: (TOptionsBase & $Dictionary & InterpolationMap<string>) | undefined) => {
        return translate(replace(key, new RegExp("_", "g"), "."), options);
     }, []);

    return { t };
}

export default useTranslate;