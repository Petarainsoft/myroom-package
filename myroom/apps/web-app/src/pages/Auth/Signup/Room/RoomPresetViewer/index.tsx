import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Swiper as ReactSwiper, SwiperSlide } from 'swiper/react';

import Image from '@/components/Image';
import RoomColor from './RoomColor';
import usePresetViewer from './hooks';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import 'swiper/css/navigation';
import './style.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';

const RoomPresetViewer = () => {
  const {
    mainSwiperRef,
    pagingSwiperRef,
    thumbsSwiper,
    roomTemplateList,
    setThumbsSwiper,
    handleChangeSlide,
    handleNext,
    handlePrev,
  } = usePresetViewer();
  const PrintPagingThumbnails = () => {
    if (!roomTemplateList) return <></>;
    return roomTemplateList.map((template, i) => {
      return (
        <SwiperSlide key={`template.id_${i}`} className="pagingSlide">
          <Image src={template.resource.thumbnail} />
        </SwiperSlide>
      );
    });
  };

  return (
    <div className="roomPresetViewerWrapper">
      <ReactSwiper
        slidesPerView={1}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        onSlideChange={handleChangeSlide}
        navigation={false}
        loop={false}
        modules={[FreeMode, Navigation, Thumbs]}
        ref={mainSwiperRef}
        className="mainSwiper"
      >
        {roomTemplateList &&
          roomTemplateList.map((template, i) => (
            <SwiperSlide key={`template.id_${i}`} className="mainSlide">
              <Image src={template.resource.thumbnail} />
            </SwiperSlide>
          ))}
      </ReactSwiper>
      <div className="mainSwiperPagingButtons">
        <CircleButton shape="circle" size="l" onClick={handlePrev}>
          <Icon name="Arrow_Left_L" />
        </CircleButton>
        <CircleButton shape="circle" size="l" onClick={handleNext}>
          <Icon name="Arrow_Right_L" />
        </CircleButton>
      </div>
      <div className="bottomWrapper">
        <div className="colorPagingWrapper">
          <RoomColor />
          <ReactSwiper
            className="presetPagingSwiper"
            slidesPerView={'auto'}
            onSwiper={setThumbsSwiper}
            modules={[FreeMode, Navigation, Thumbs]}
            ref={pagingSwiperRef}
          >
            {PrintPagingThumbnails()}
          </ReactSwiper>
        </div>
      </div>
    </div>
  );
};
export default RoomPresetViewer;
