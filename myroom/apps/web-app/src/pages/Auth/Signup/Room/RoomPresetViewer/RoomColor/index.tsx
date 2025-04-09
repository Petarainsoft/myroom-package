import { FreeMode, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
// import styled from "styled-components";
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import style from './styles.module.scss';
import Text from '@/components/Text';
import useRoomColor from './hooks';

const RoomColor = () => {
  const { colorIndex, colorList, handleColorSlideClick } = useRoomColor();

  const PrintColorSlides = () => {
    return colorList.map((color, i) => {
      const addClassName = colorIndex == i ? style.selected : '';
      return (
        <SwiperSlide
          key={i}
          className={`${style.colorSlide} ${addClassName}`}
          style={{ backgroundColor: color }}
        />
      );
    });
  };
  return (
    <div className={style.colorWrapper}>
      <div className={style.title}>
        <Text locale={{ textId: 'GSU.000021' }} />
      </div>

      <Swiper
        slidesPerView={'auto'}
        freeMode={true}
        modules={[FreeMode, Navigation]}
        onClick={handleColorSlideClick}
        className={style.colorSwiper}
      >
        {PrintColorSlides()}
      </Swiper>
    </div>
  );
};
export default RoomColor;
