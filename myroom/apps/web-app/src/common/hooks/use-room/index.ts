import { useAtom } from "jotai";
import { currentRoomInfoAtom, hideRoomPlaceUIAtom, meRoomManifestAtom, recommendFiguresIdsAtom, roomBackgroundColorAtom, roomSelectedItemAtom } from "./store";
import useLocalStorage from "use-local-storage";
import { useCallback } from "react";
import useFollowAPI from "@/apis/User/Follow";
import useProfileAPI from "@/apis/User/Profile";
import { IOutsideFigureInfo } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import { C_WebConstant } from 'client-core/tableData/defines/System_Constant';
import { SceneManager } from "@/common/utils/client";

const useRoom = () => {
    const { fetchMeFollowings } = useFollowAPI();
    
    /**
     * ????: 왜 인피니티 스크롤를 안한건지 확인필요.
    */
    const { data: followingsData, isSuccess: isFollowingsDataSuccess } = fetchMeFollowings({limit: 15});
    //
    const { mutationFetchProfile } = useProfileAPI();
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
    const [recommendFiguresIds, setRecommendFiguresIds] = useAtom(recommendFiguresIdsAtom);
    
    //
    const recommendFigures = useCallback(async () => {
        if (isFollowingsDataSuccess) {
            const list = followingsData?.list?.map(x => {
                return x._id;
            });
            
            if (list) {
                const figureIds = await Promise.all(list.map(async (id) => {
                    const res = await mutationFetchProfile.mutateAsync({ profileId: id });
                    return res?.data.avatar_id;
                }));

                SceneManager.Room?.getAllFigureIds((ids) => {
                    
                    // 방에 있는 피규어 제거후 최대개수 설정.
                    const filteredIds = figureIds.filter((x) : x is string => typeof x === "string" && !ids.includes(x)).slice(0, C_WebConstant.OUTSIDE_FIGURE_RECOMMEND);
                    const result = filteredIds.reduce<IOutsideFigureInfo[]>((acc, currentAvatarId) => {
                        // 각 avatarId를 { avatarId: "..." } 형식으로 변환하여 배열에 추가
                        if (currentAvatarId) {
                            acc.push({ avatarId: currentAvatarId });    
                        }
                        return acc;
                    }, [])
                    
                    SceneManager.Room?.createOutsideFigures(result, () => { 
                        if (figureIds) {
                            setRecommendFiguresIds([...filteredIds]);    
                        }
                    });    
                });
            }
        }
    }, [isFollowingsDataSuccess]);
    
    return {
        recommendFigures,
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

export default useRoom;1