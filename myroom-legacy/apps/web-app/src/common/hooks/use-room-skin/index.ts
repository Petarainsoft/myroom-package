import useItemAPI from "@/apis/Meta/Item";
import { IAssetManifest_MyRoom } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";
import { useCallback } from "react";



const useRoomSkin = () => {
    const { mutationItem } = useItemAPI();

    /**
     * thumbnail.png 와 동일 resource 디렉토리에 placeinfo.json 존재
     * 이 json 파일에 현재 manifest 데이터들을 이동시키고 이 json을 initialize
     * 또한 최초로 makeManifest된 manifest를 initialize를 해야함
     * (복층 관련 문제 때문에 로직 변경)
     * 
     * 
     * history : placeinfo.json -> manifest로 바꿔야하지 않을까?
    */
    const fetchSkinManifest = useCallback(async (itemId:string) : Promise<IAssetManifest_MyRoom | null> =>{
        const itemRes = await mutationItem.mutateAsync({itemId});
        if(itemRes && itemRes?.data.resource.manifest)  {  
            const resourceUrl: Array<string> = itemRes.data.resource.manifest.split('/');
            resourceUrl.pop();
            resourceUrl.push('placeinfo.json');
            
            const url = resourceUrl.join('/');
            const res = await fetch(url);
            if(res.ok) {
                return await res.json();
            }
        }
        
        return null;
    }, []);
   

    return {fetchSkinManifest}
}

export default useRoomSkin;