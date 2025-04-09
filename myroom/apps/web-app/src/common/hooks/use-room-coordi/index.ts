import useItemAPI from "@/apis/Meta/Item";
import useMyRoomAPI from "@/apis/Space/MyRoom";
import { SceneManager } from "@/common/utils/client";
import { AssetUtils } from "client-core/assetSystem/assetUtils";
import { EMyRoomMode } from "client-core/assetSystem/controllers/myRoomController";
import { IAssetManifest_MyRoom } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import { useCallback } from "react";
import useThumbnail from "../use-thumbnail";



const useRoomCoordi = () => {
    const { mutationFetchMyroomTemplate, mutationPostMyroomTemplate } = useMyRoomAPI();
    const { mutationItem } = useItemAPI();
    const { createThumbnail } = useThumbnail();

    const postMyroomCoordi = useCallback((roomId:string, onSuccess?:()=>void)=>{
        SceneManager.Room?.makeMyRoomManifest((manifest) => {
            SceneManager.Room?.clearMyRoom();
    
            if (manifest) {
                SceneManager.Room?.initializeMyRoom(manifest, true, () => {
                    SceneManager.Room?.makeMyRoomManifest((coordiManifest) => {
                        createThumbnail(SceneManager.Room, async (id) => { 
                            await mutationPostMyroomTemplate.mutateAsync({
                                id: roomId,
                                data: {
                                    resource: { thumbnail: id },
                                    manifest: coordiManifest
                                },
                            });
            
                            SceneManager.Room?.clearMyRoom();
                            SceneManager.Room?.initializeMyRoom(manifest, false, () => {
                                SceneManager.Room?.getMyRoomMode((mode) => {
                                    SceneManager.Room?.startMyRoomPlacementMode();
                                });

                                if(onSuccess) {
                                    onSuccess();
                                }
                            });
                        });
                    });
                });
            }
        });
    },[]);
   

    const fetchSystemCoordiManifest = useCallback(async (id:string, avatarId:string) => {
        const res = await mutationItem.mutateAsync({itemId: id});
        if(res &&   res?.data.resource.manifest) {
            const manifest = await AssetUtils.readJsonFromUrl<IAssetManifest_MyRoom>(res?.data.resource.manifest);
            if(manifest) {
                if (!manifest.main.figures) manifest.main.figures = [];

                manifest.main.figures.push({
                  avatarId,
                  isAvatar: true,
                  placeInfo: manifest.main.defaultAvatarPos,
                  parentId: '',
                });


                return manifest;
            }
        }

        return null;
    }, []);

    const fetchMyCoordiManifest = useCallback(async (roomId:string, templateId:string) => {
        return await mutationFetchMyroomTemplate.mutateAsync({
            id: roomId,
            templateId: templateId,
          });
    }, [mutationFetchMyroomTemplate]);

    const changeRoomCoordi = useCallback(async (manifest:any) => {
        SceneManager.Room?.getMyRoomMode((mode) => {
            if (mode === EMyRoomMode.Placement) {
                SceneManager.Room?.endMyRoomPlacementMode();
            }
            SceneManager.Room?.clearMyRoom();
            SceneManager.Room?.initializeMyRoom(manifest, false, () => {
                SceneManager.Room?.getMyRoomMode((mode) => {
                if (mode !== EMyRoomMode.Placement) {
                    SceneManager.Room?.startMyRoomPlacementMode();
                }
                });
            });
        });
    }, []);

    return { changeRoomCoordi, fetchSystemCoordiManifest, fetchMyCoordiManifest, postMyroomCoordi }
}

export default useRoomCoordi;  