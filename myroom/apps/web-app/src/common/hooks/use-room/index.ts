import { useAtom } from "jotai";
import { currentRoomInfoAtom, hideRoomPlaceUIAtom, meRoomManifestAtom, recommendFiguresIdsAtom, roomBackgroundColorAtom, roomSelectedItemAtom } from "./store";
import useLocalStorage from "use-local-storage";

const useRoom = () => {
    

    //
    const [currentRoomInfo, setCurrentRoomInfo] = useAtom(currentRoomInfoAtom);
    //
    const [showAlwaysRoomInfo, setShowAlwaysRoomInfo] = useLocalStorage('SHOW_ALWAYS_ROOM_INFO', true);
    //
    const [hideRoomPlaceUI, setHideRoomPlaceUI] = useAtom(hideRoomPlaceUIAtom);
    //
    const [meRoomManifest, setMeRoomManifest] = useAtom(meRoomManifestAtom);
    //
    const [roomBackgroundColor, setRoomBackgroundColor] = useAtom(roomBackgroundColorAtom);
    //
    const [roomSelectedItem, setRoomSelectedItem] = useAtom(roomSelectedItemAtom);
    //
    const [recommendFiguresIds] = useAtom(recommendFiguresIdsAtom);
    
    //
    // const recommendFigures = useCallback(async () => {
    //       SceneManager.Room?.getAllFigureIds((ids) => {
                    
    //         // 방에 있는 피규어 제거후 최대개수 설정.
    //         const filteredIds = ids.filter((x) : x is string => typeof x === "string" && !ids.includes(x)).slice(0, C_WebConstant.OUTSIDE_FIGURE_RECOMMEND);
    //         const result = filteredIds.reduce<IOutsideFigureInfo[]>((acc, currentAvatarId) => {
    //             // 각 avatarId를 { avatarId: "..." } 형식으로 변환하여 배열에 추가
    //             if (currentAvatarId) {
    //                 acc.push({ avatarId: currentAvatarId });    
    //             }
    //             return acc;
    //         }, [])
            
    //         SceneManager.Room?.createOutsideFigures(result, () => { 
    //             if (ids) {
    //                 setRecommendFiguresIds([...filteredIds]);    
    //             }
    //         });    
    //     });
    // }, [isFollowingsDataSuccess]);
    
    return {
        roomBackgroundColor,
        setRoomBackgroundColor,
        hideRoomPlaceUI,
        setHideRoomPlaceUI,
        currentRoomInfo,
        setCurrentRoomInfo,
        showAlwaysRoomInfo,
        setShowAlwaysRoomInfo,
        meRoomManifest,
        setMeRoomManifest,
        roomSelectedItem,
        setRoomSelectedItem,
        recommendFiguresIds
    }
}

export default useRoom;