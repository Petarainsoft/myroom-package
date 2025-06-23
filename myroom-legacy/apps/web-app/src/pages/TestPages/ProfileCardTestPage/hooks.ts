import useItemAPI from "@/apis/Meta/Item";
import useAvatarAPI from "@/apis/Space/Avatar";
import { WORLD_ID } from "@/common/constants";
import useThumbnail from "@/common/hooks/use-thumbnail";
import { IAssetManifest_ProfileCard } from "@/common/jsonTypes/assetManifest_ProfileCard";
import { SceneManager } from "@/common/utils/client";
import { EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

const useProfileCardTestPage = ()=>{
  const [strCardJson, setStrCardJson] = useState<string>();
  const [avatarId, ] = useState<string>('1szXSDi7EaCqA7QXtgyCe');
  const [cardManifest, setCardManifest] = useState<IAssetManifest_ProfileCard>();
  const [imageFileList, setImageFileList] = useState<FileList | null>();
  //-- Avatar --//
  const [ sceneStatus, setSceneStatus ] = useState('NONE');
  const { fetchAvatar, fetchAvatarManifest } = useAvatarAPI();
  const { data: avatarData } = fetchAvatar(avatarId ?? '');
  const { data: avatarManifest } = fetchAvatarManifest(
    avatarId ?? '',
    avatarData?.data?.option?.version,
  );
  const {data:actionItems} = useItemAPI().fetchItems({w:WORLD_ID, category:EItemCategory3.STATUSFEEL.toString()})
  const [currentActionIndex, setCurrentActonIndex] = useState(-1);
  const [avatarImageData, setAvatarImageData] = useState('');
  const { createThumbnailBase64Data, base64ToFile } = useThumbnail();

  const onAfterSceneReady = useCallback(() => {
    setSceneStatus('INITIALIZED');
  }, []);
  useEffect(() => {
    if (!avatarId) return;
    if (sceneStatus === 'INITIALIZED' && avatarManifest) {
      SceneManager.Avatar?.initializeAvatar(avatarId, avatarManifest, () => {
        setSceneStatus('AVATAR_INITIALIZED');
      });
    }
  }, [sceneStatus, avatarId, avatarManifest, currentActionIndex]);

  
  useEffect(()=>{
    if(!strCardJson)
      return;
    const profileCard = JSON.parse(strCardJson) as IAssetManifest_ProfileCard;
    if(profileCard){
      setCardManifest(profileCard);
    }
  },[strCardJson]);

  const findImageFileInFileList = useCallback((fileName : string)=>{
    if(!imageFileList)
      return null;
    for(let i=0; i<imageFileList.length; ++i){
      if(imageFileList[i].name === fileName)
        return imageFileList[i];
    }
  },[imageFileList]);
  useEffect(()=>{
    if(!cardManifest || !imageFileList)
      return;
    if(cardManifest as IAssetManifest_ProfileCard){
      let newCardManifestList :IAssetManifest_ProfileCard = {format:cardManifest.format, main:cardManifest.main};// = [...cardManifest];
      // find image. 
      if(newCardManifestList.main.background){
        const file = findImageFileInFileList(newCardManifestList.main.background);
        if(file){
          newCardManifestList.main.background = URL.createObjectURL(file);
        }
      }
      if(newCardManifestList.main.imageTransforms){
        for(let i=0; i<newCardManifestList.main.imageTransforms.length; ++i){
          const file = findImageFileInFileList(newCardManifestList.main.imageTransforms[i].name);
          if(file){
            newCardManifestList.main.imageTransforms[i].name = URL.createObjectURL(file);
          }
        }
      }
      setImageFileList(null);
      setCardManifest(newCardManifestList);
    }
  },[cardManifest, imageFileList])

  const handleOnChangeManifestText = useCallback((e:ChangeEvent<HTMLTextAreaElement>)=>{
    
  },[]);
  const handleOnChangeJsonFileField = useCallback((e:ChangeEvent<HTMLInputElement>)=>{
    if(!e.target || !e.target.files)
      return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = loaded => {
      if(loaded?.target?.result){
        setStrCardJson(loaded?.target?.result.toString());
      }
    };
    
  },[]);

  useEffect(()=>{
    if(sceneStatus === 'AVATAR_INITIALIZED' && actionItems){
      changeAvatarActionIndex(0);
    }
  },[sceneStatus, actionItems]);

  const changeAvatarActionIndex = useCallback(async (index:number) =>{
    if(!actionItems || !actionItems.list || actionItems.list.length === 0)
      return;
    if(actionItems.list.length <= index)
      index = 0;
    const actionItem = actionItems.list.at(index);
    if(actionItem){
      SceneManager.Avatar?.playAnimation(actionItem._id, '_01').then(()=>{
        setCurrentActonIndex(index);
        createThumbnailBase64Data(SceneManager.Avatar, 512, (data) => {
          setAvatarImageData(data);
        });
      });
    }
  }, [actionItems, setCurrentActonIndex, setAvatarImageData]);

  const handleNextAvatarAction = ()=>{
    changeAvatarActionIndex(currentActionIndex+1);
  }

  const handleOnChangeImagesField = useCallback((e:ChangeEvent<HTMLInputElement>)=>{
    console.log(e.target.files);
    setImageFileList(e.target.files);
  },[]);
  
  return {
    avatarId,
    strCardJson,
    cardManifest,
    avatarImageData,
    onAfterSceneReady,
    handleNextAvatarAction,
    handleOnChangeImagesField, 
    handleOnChangeJsonFileField, 
    handleOnChangeManifestText,
  };
};
export default useProfileCardTestPage;