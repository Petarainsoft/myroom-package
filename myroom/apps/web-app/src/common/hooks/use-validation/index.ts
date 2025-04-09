import { useCallback } from "react";




const useValidation = () => {

    /**
     * 검색어 유효성 체크
     */
    const checkSearchText = useCallback((text: string) => {
        return true;
    },[]);


    return {checkSearchText}
}

export default useValidation;