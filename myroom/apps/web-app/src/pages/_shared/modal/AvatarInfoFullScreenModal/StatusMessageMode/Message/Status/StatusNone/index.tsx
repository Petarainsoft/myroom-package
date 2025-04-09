import 'swiper/css';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import './style.scss';

import {
  isOpenMessageInputEditModalAtom,
  statusEditSlideActiveIndex,
} from '@/common/stores';
import { useAtom } from 'jotai';
import Icon from '@/components/Icon';
import StatusMessageItem from '../../Component/StatusMessageItem';
import ImageUploader from '../../Component/ImageUploader';
import { useRef } from 'react';
enum EStateIndex {
  MESSAGE,
  IMAGE,
}

const isActiveSlide = (
  myIndex: EStateIndex,
  currentIndex: EStateIndex,
): boolean => {
  if (myIndex === currentIndex) {
    return true;
  }
  return false;
};

const StatusNone = () => {
  const [activeIndex, setActiveIndex] = useAtom(statusEditSlideActiveIndex);
  const [isOpenMessageInputEditModal] = useAtom(
    isOpenMessageInputEditModalAtom,
  );
  const handleGoToSlide = (index: number) => () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(index);
    }
  };
  const InactiveSlideComponent = ({ status }: { status: number }) => {
    if (status === EStateIndex.IMAGE) {
      return (
        <div
          className={'inactiveSlide right'}
          onClick={handleGoToSlide(EStateIndex.IMAGE)}
        >
          <div>
            <div className={'iconWrapper'}>
              <Icon name={'ImgUP_S'} badge={{isActive:false}} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <div
          className={'inactiveSlide left'}
          onClick={handleGoToSlide(EStateIndex.MESSAGE)}
        >
          <div>
            <div className={'iconWrapper'}>
              <Icon name={'Action_Message_S'} badge={{isActive:false}}/>
            </div>
          </div>
        </div>
      </>
    );
  };
  const swiperRef = useRef<SwiperRef>(null);
  return (
    <>
      <Swiper
        ref={swiperRef}
        slidesPerView={2}
        allowTouchMove={true}
        centeredSlides={true}
        slidesPerGroupSkip={1}
        initialSlide={activeIndex}
        spaceBetween={0}
        className={`mySwiper`}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.activeIndex);
        }}
      >
        {!isOpenMessageInputEditModal && (
          <>
            <SwiperSlide className={''}>
              {isActiveSlide(EStateIndex.MESSAGE, activeIndex) ? (
                <div className="slideWrapper">
                  <StatusMessageItem />
                  <InactiveSlideComponent status={EStateIndex.IMAGE} />
                </div>
              ) : (
                <></>
              )}
            </SwiperSlide>
            <SwiperSlide className={''}>
              {/* 이미지업로드 */}
              {isActiveSlide(EStateIndex.IMAGE, activeIndex) ? (
                <div className="slideWrapper">
                  <ImageUploader />
                  <InactiveSlideComponent status={EStateIndex.MESSAGE} />
                </div>
              ) : (
                <></>
              )}
            </SwiperSlide>
          </>
        )}
      </Swiper>
    </>
  );
};

export default StatusNone;
