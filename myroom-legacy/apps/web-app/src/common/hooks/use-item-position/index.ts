import { SceneManager, SceneType } from "@/common/utils/client";
import { useCallback, useEffect, useRef } from "react";




const useItemPosition = () => {
    
    const ref = useRef<HTMLDivElement>(null);
  
    const callbackCanvasPositionEvent = useCallback((data: any)=>{
        if (ref && ref.current) {
            const translateYValue = Math.round(
              data._y - ref.current.getBoundingClientRect().height,
            );
            const translateXValue = Math.round(
              data._x - ref.current.getBoundingClientRect().width / 2,
            );
  
            const transformValue = `translate(${translateXValue}px, ${translateYValue}px)`;
  
            if (
              ref?.current?.style.getPropertyValue('transform') !== transformValue
            ) {
              ref?.current?.style.setProperty('transform', transformValue);
            }
          }
    },[ref]);

    return {ref, callbackCanvasPositionEvent}
}

export default useItemPosition;