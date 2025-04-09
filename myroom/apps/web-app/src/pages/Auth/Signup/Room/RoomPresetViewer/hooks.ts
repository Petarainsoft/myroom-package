import React, { useCallback } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { type Swiper } from 'swiper';
import { EItemCategory2 } from 'client-core';
import { SwiperRef } from 'swiper/react';
import useItemAPI from '@/apis/Meta/Item';
import { WORLD_ID } from '@/common/constants';
import { signup_roomTemplateItemDataAtom } from '@/common/stores';

const usePresetViewer = () => {
  const roomTemplateList = useItemAPI().fetchItems({
    w: WORLD_ID,
    category: EItemCategory2.INDOORCOORDI.toString(),
  }).data?.list;
  const [roomTemplateItemData, setRoomTemplateItemData] = useAtom(
    signup_roomTemplateItemDataAtom,
  );
  const [thumbsSwiper, setThumbsSwiper] = useState<Swiper | null>(null);

  const mainSwiperRef = useRef<SwiperRef>(null);
  const pagingSwiperRef = useRef<SwiperRef>(null);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(-1);

  const handleChangeSlide = React.useCallback((swiper: Swiper) => {
    if (swiper) {
      setCurrentTemplateIndex(swiper.activeIndex);
    }
  }, []);
  useEffect(() => {
    if (!roomTemplateList) {
      return;
    }

    if (
      currentTemplateIndex < 0 ||
      roomTemplateList.length <= currentTemplateIndex
    ) {
      return;
    }

    if (mainSwiperRef.current) {
      mainSwiperRef.current.swiper.slideTo(currentTemplateIndex);
    }

    setRoomTemplateItemData(roomTemplateList[currentTemplateIndex]);
  }, [currentTemplateIndex, roomTemplateList, setRoomTemplateItemData]);

  const handleNext = useCallback(() => {
    if (!roomTemplateList) return;

    if (roomTemplateList.length - 1 <= currentTemplateIndex) {
      setCurrentTemplateIndex(0);
    } else {
      setCurrentTemplateIndex(currentTemplateIndex + 1);
    }
  }, [roomTemplateList, currentTemplateIndex]);

  const handlePrev = () => {
    if (!roomTemplateList) return;
    if (currentTemplateIndex == 0) {
      setCurrentTemplateIndex(roomTemplateList.length - 1);
    } else {
      setCurrentTemplateIndex(currentTemplateIndex - 1);
    }
  };

  useEffect(() => {
    // 맨 처음 template으로 설정.
    if (
      roomTemplateList &&
      roomTemplateList.length > 0 &&
      roomTemplateItemData == null
    ) {
      setCurrentTemplateIndex(0);
    }

    mainSwiperRef.current?.swiper.update();
    pagingSwiperRef.current?.swiper.update();
  }, [roomTemplateList, roomTemplateItemData]);
  return {
    mainSwiperRef,
    pagingSwiperRef,
    thumbsSwiper,
    roomTemplateList,
    handleNext,
    handlePrev,
    setThumbsSwiper,
    handleChangeSlide,
  };
};
export default usePresetViewer;
