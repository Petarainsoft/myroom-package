import React from 'react';
import { useState, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { Swiper } from 'swiper';
import { signup_roomColorAtom } from '@/common/stores';
const useRoomColor = () => {
  const setRoomColor = useSetAtom(signup_roomColorAtom);
  const [colorIndex, setColorIndex] = useState(0);
  const colorList = [
    '#f1dcbd',
    '#fec8ac',
    '#ffacc3',
    '#a8e8d7',
    '#adbaf2',
    '#7c94e8',
    '#d6b6f9',
    '#5e406c',
    '#303030',
    '#0d1a23',
  ];
  useEffect(() => {
    setColorIndex(colorIndex);
    setRoomColor(colorList[colorIndex]);
  }, []);
  const handleColorSlideClick = React.useCallback((swiper: Swiper) => {
    if (swiper.clickedIndex == undefined) return;
    setColorIndex(swiper.clickedIndex);
    setRoomColor(colorList[swiper.clickedIndex]);
  }, []);
  return { colorIndex, colorList, handleColorSlideClick };
};
export default useRoomColor;
