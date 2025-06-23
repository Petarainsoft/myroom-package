import useAvatarAPI from '@/apis/Space/Avatar';
import { SceneManager } from '@/common/utils/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useThumbnail from '@/common/hooks/use-thumbnail';
import { SwiperRef } from 'swiper/react';
import html2canvas from 'html2canvas';
import share from '@/common/utils/share';
import useItemAPI from '@/apis/Meta/Item';
import { WORLD_ID } from '@/common/constants';
import { EItemCategory3 } from 'client-core/tableData/defines/System_Enum';
import useProfile from '@/pages/Profile/useProfile';
import { IAssetManifest_ProfileCard } from "@/common/jsonTypes/assetManifest_ProfileCard";
import { AssetUtils } from 'client-core';


const useProfileCard = (profileId: string) => {
  const {userName, avatarId} = useProfile({profileId:profileId, isMine:false});
  const cardItemList = useItemAPI().fetchItems({
    w: WORLD_ID,
    category: EItemCategory3.PROFILECARD.toString(),
  }).data?.list;
  const [cardManifestList, setCardManifestList] = useState<IAssetManifest_ProfileCard[]>([]);
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

  const cardSwiperRef = useRef<SwiperRef>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  
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
    if(sceneStatus === 'AVATAR_INITIALIZED' && actionItems){
      changeAvatarActionIndex(0);
    }
  },[sceneStatus, actionItems])
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

  //-- card manifest --//
  useEffect(()=>{
    if(!cardItemList)
      return;
    loadCardListManifest();
  },[cardItemList]);

  const loadCardListManifest = useCallback(async ()=>{
    if(!cardItemList)
      return;
    let newCardManifestList : IAssetManifest_ProfileCard[] = [];
    for(let i=0; i<cardItemList.length; ++i){
      let cardManifest = await AssetUtils.readJsonFromUrl(cardItemList[i].resource.manifest) as IAssetManifest_ProfileCard;
      if(cardManifest){
        cardManifest.main.resourceBasePath = cardItemList[i].resource.thumbnail.replace('thumbnail.png','')
        newCardManifestList.push(cardManifest);
      }
    }
    setCardManifestList(newCardManifestList);
  },[cardItemList]);
  useEffect(()=>{
    if(!cardSwiperRef || !cardSwiperRef.current || cardSwiperRef.current.swiper.activeIndex === currentCardIndex)
      return;
    
    cardSwiperRef.current.swiper.slideTo(currentCardIndex);
  },[currentCardIndex]);

  const handlePrevCard = useCallback(()=>{
    console.log('handlePrevCard.');
    if (!cardManifestList) return;
    if (currentCardIndex == 0) {
      setCurrentCardIndex(cardManifestList.length - 1);
    } else {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  },[cardManifestList, currentCardIndex, setCurrentActonIndex]);

  const handleNextCard = useCallback(()=>{
    if (!cardManifestList) return;
    if (currentCardIndex == cardManifestList.length - 1) {
      setCurrentCardIndex(0);
    } else {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  },[cardManifestList, currentCardIndex, setCurrentActonIndex]);
  const handleCardSwiperChanged = useCallback(()=>{
    if(!cardSwiperRef || !cardSwiperRef.current)
      return;
    setCurrentCardIndex(cardSwiperRef.current.swiper.activeIndex);
      
  },[cardSwiperRef, currentCardIndex]);

  
  
  const getCurrentSlide = useCallback(()=>{
    if(!cardSwiperRef || !cardSwiperRef.current)
      return;
    console.log("getCurrentSlide - ", currentCardIndex);
    return cardSwiperRef.current.swiper.slides[currentCardIndex];
  },[cardSwiperRef, currentCardIndex]);

  const handleSave = useCallback(()=>{
    const currentSlide = getCurrentSlide();
    if(!currentSlide)
      return;
    
    html2canvas(currentSlide).then((canvas) => {
      const url = canvas.toDataURL('image/png');
      if(hiddenAnchorRef && hiddenAnchorRef.current)
      {
        hiddenAnchorRef.current.download = 'test';
        hiddenAnchorRef.current.href = url;
        hiddenAnchorRef.current.click();
      }
    });
  },[getCurrentSlide, hiddenAnchorRef]);
  
  const handleShare = useCallback(()=>{
    const currentSlide = getCurrentSlide();
    if(!currentSlide)
      return;
    html2canvas(currentSlide).then((canvas)=>{
      const url = canvas.toDataURL('image/png');
      const file = base64ToFile(url, 'profileCard.png');
      if(file && file as File)
        share({files:[file]});
    });
  },[getCurrentSlide]);

  
  return { userName, cardManifestList, currentCardIndex, cardSwiperRef, hiddenAnchorRef, avatarImageData, onAfterSceneReady, handleNextAvatarAction, handlePrevCard, handleNextCard, handleCardSwiperChanged, handleSave, handleShare};
};
export default useProfileCard;
