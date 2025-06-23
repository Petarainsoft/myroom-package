import { useCallback, useEffect, useState } from "react";


type WindowingOptions = {
    width: number;
    height: number;
    itemWidth: number;
    itemHeight: number;
    itemWidthGap: number;
}

const useWindowing = ({ width, itemWidth, itemHeight, itemWidthGap }: WindowingOptions) => { 
    const [columnCount, setColumnCount] = useState<number>(0);

    const onResize = useCallback(() => {
        const count = Math.floor((width + itemWidthGap) / (itemWidth + itemWidthGap));
        console.log("count", count);
        setColumnCount(count);
    }, [itemWidth, itemWidthGap, width]);
    
    const gridOnItemsRendered = useCallback((
        { visibleRowStartIndex, visibleRowStopIndex, visibleColumnStartIndex, visibleColumnStopIndex }:
            { visibleRowStartIndex: number, visibleRowStopIndex: number, visibleColumnStartIndex: number, visibleColumnStopIndex: number },
        onItemsRendered: (params: { overscanStartIndex: number, overscanStopIndex: number, visibleStartIndex: number, visibleStopIndex: number }) => void
    ) => {
        onItemsRendered({
            overscanStartIndex: visibleRowStartIndex * columnCount + visibleColumnStartIndex,
            overscanStopIndex: visibleRowStopIndex * columnCount + visibleColumnStopIndex,
            visibleStartIndex: visibleRowStartIndex * columnCount,
            visibleStopIndex: visibleRowStopIndex * columnCount + columnCount - 1
        });
    }, [columnCount]);

    const gridStyleWithGap = useCallback((baseStyle: any, columnIndex: number, topPadding: number = 0) => {
        const totalItemWidthWithGap = (itemWidth * columnCount) + (itemWidthGap * (columnCount - 1));
        const remainingSpace = width - totalItemWidthWithGap;
        const leftPadding = remainingSpace / 2;
    
        return {
            ...baseStyle,
            left: leftPadding + baseStyle.left + columnIndex * itemWidthGap,
            top: topPadding + baseStyle.top,
        };
    }, [columnCount, itemWidth, itemWidthGap, width]);

    useEffect(() => {
        onResize();

        window.addEventListener('resize', onResize);
        return () => { 
            window.removeEventListener('resize', onResize);
        }
    }, [onResize]);
    
    return {columnCount, itemWidth, itemHeight, gridStyleWithGap, gridOnItemsRendered}
}

export default useWindowing;