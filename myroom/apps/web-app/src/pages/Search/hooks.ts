import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import usePopup from "@/common/hooks/Popup/usePopup";
import useSearch from "@/common/hooks/use-search";
import useValidation from "@/common/hooks/use-validation";

const useSearchPage = () => { 
    const inputRef = useRef<HTMLInputElement>(null);
    const { query, goToSearch } = useSearch();

    const [searchText, setSearchText] = useState<string>("");

    const { checkSearchText } = useValidation();
    const { showToastPopup } = usePopup();
    
    const navigate = useNavigate();

    /**
     * 
     */
    const handleClickClose = useCallback(() => { 
        navigate(-1);    
    }, [navigate]);

    /**
     * 
     */
    const handleChangeSearchText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target?.value);
    }, [setSearchText]);

    /**
     * 
     */
    const handleClickResetSearchText = useCallback(() => {
        setSearchText('');

        // 초기화
        goToSearch();
    }, [setSearchText, goToSearch]);


    /**
     * 
     */
    const handleSubmit = () => {
        if (checkSearchText(searchText)) {
            goToSearch(searchText);
        }
        else {
            showToastPopup({ titleText: "검색어가 너무 짧아요. 한글 2자, 영문 3자 이상 입력해주세요." });
        }
    };

    useEffect(() => {
        if (query) {
            setSearchText(query);
        }
    }, [query]);
    
    useEffect(() => {
        inputRef.current?.focus();
     }, []);

    return {inputRef, query, searchText, handleChangeSearchText, handleClickClose, handleClickResetSearchText, handleSubmit}
};

export default useSearchPage;