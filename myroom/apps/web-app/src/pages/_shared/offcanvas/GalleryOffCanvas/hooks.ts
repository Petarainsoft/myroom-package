import { useCallback, useState } from "react";
import { ContentsProps } from ".";
import useResizeObserver from "use-resize-observer";
import useWindowing from "@/common/hooks/use-windowing";
import { GridOnScrollProps } from "react-window";
import React from "react";
import useCart from "@/common/hooks/Cart";


type useGalleryOffCanvasProps = {
    contents: ContentsProps;
    onToggle?:() => void;
    onClickCategory?: (id: string) => void;
    onClickSubCategory?: (id:string) => void;
}

const useGalleryOffCanvas = ({ contents, onToggle, onClickCategory, onClickSubCategory }: useGalleryOffCanvasProps) => { 
    const { clearCartItem } = useCart();

    const { ref: contentsWrapRef, width = 1, height = 1 } = useResizeObserver<HTMLDivElement>();
    const { columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered } = useWindowing({
        width,
        height,
        itemWidth: contents.shape === 'rect' ? 103: 60,
        itemWidthGap: contents.shape === 'rect' ? 13 : 9,
        itemHeight: contents.shape === 'rect' ? 162 : 90,
    });

 
    const [showSubCategory, setShowSubCategory] = useState(true);
    const [minimize, setMinimize] = useState(false);

    const handleClickMinimize = useCallback(() => { 
        setMinimize(prev => !prev);
    }, []);

    const handleClickCategory = useCallback((id:string) => { 
        if (onClickCategory) {
            onClickCategory(id);
        }
    }, [onClickCategory]);

    const handleClickSubCategory = useCallback((id:string) => { 
        if (onClickSubCategory) {
            onClickSubCategory(id);
        }
    }, [onClickSubCategory]);

    const handleToggle = useCallback(() => { 
        if (onToggle)
            onToggle();
    }, [onToggle]);

    const handleScroll = useCallback((e: GridOnScrollProps) => {
        setShowSubCategory(e.scrollTop < 5);
    }, []);


    React.useEffect(() => {
        return () => {
            clearCartItem();
        }
    }, [clearCartItem]);
    
    React.useEffect(() => {
        // 뒤로가기 방지
        history.pushState(null, '', location.href);
        window.onpopstate = () => {
          history.go(1);
        };
    
        // 새로고침 방지
        window.onbeforeunload = function () {
          return '';
        };
    
        return () => {
          window.onbeforeunload = null;
          window.onpopstate = null;
        };
    }, []);

    return {minimize, columnCount, width, height, showSubCategory, contentsWrapRef, itemWidth, itemHeight, handleClickMinimize, handleClickCategory, handleClickSubCategory, handleToggle, gridStyleWithGap, gridOnItemsRendered, handleScroll}
}

export default useGalleryOffCanvas;