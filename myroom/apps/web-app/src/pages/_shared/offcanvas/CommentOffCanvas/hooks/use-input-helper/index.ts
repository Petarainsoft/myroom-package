import { useAtom } from "jotai";
import { InputHelperState, inputHelperStateAtom } from "./store";
import { useCallback } from "react";

const useInputHelper = () => { 
    const [inputHelperState, setInputHelperState] = useAtom(inputHelperStateAtom);
    
    const showInputHelper = useCallback((params: InputHelperState) => {
        setInputHelperState(params);    
    }, [setInputHelperState]);

    const hideInputHelper = useCallback(() => {
        setInputHelperState(null);
    }, [setInputHelperState]);
    

    return {inputHelperState, showInputHelper, hideInputHelper}
}

export default useInputHelper;