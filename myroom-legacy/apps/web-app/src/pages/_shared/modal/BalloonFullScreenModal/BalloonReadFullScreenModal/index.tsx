import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import titleStyle from '../titleStyle.module.scss';
import Button from '@/components/Buttons/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { BalloonData } from '@/apis/Social/Balloons/type';
import BalloonSlideContent from './BalloonSlideContent';
import useBalloonReadFullScreenModal from './hooks';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import Text from '@/components/Text';
import style from './style.module.scss';
interface IBalloonReadFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  targetRoomProfileId: string;
  targetRoomId: string;
  balloonData: BalloonData;
}
const BalloonReadFullScreenModal = ({
  targetRoomProfileId,
  targetRoomId,
  balloonData,
  onRequestClose,
}: IBalloonReadFullScreenModal) => {
  const {
    currentBalloonData,
    prevBalloonData,
    nextBalloonData,
    bottomMenus,
    handlePrevBalloon,
    handleNextBalloon,
    handleList,
    handleWrite,
    isOptionMenuShow,
    setIsOptionMenuShow,
  } = useBalloonReadFullScreenModal(
    targetRoomProfileId,
    targetRoomId,
    balloonData,
    onRequestClose,
  );

  const Header = () => {
    return (
      <div className={titleStyle.title}>
        <div className={titleStyle.leftSide}>
          <CustomButton className={titleStyle.btnBack} onClick={onRequestClose}>
            <Icon name="Top_Arrow_left_M" />
          </CustomButton>
        </div>
        <div className={titleStyle.rightSide}>
          <CustomButton
            onClick={() => {
              setIsOptionMenuShow(true);
            }}
          >
            <Icon name="Top_Menu_User"></Icon>
          </CustomButton>
        </div>
      </div>
    );
  };
  const ContentSwiperSlide = () => {
    return (
      <SwiperSlide className={style.slide}>
        {currentBalloonData ? (
          <BalloonSlideContent data={currentBalloonData} />
        ) : null}
      </SwiperSlide>
    );
  };
  return (
    <Modal isOpen={true}>
      <div className={style.background}>
        <Header />
        <div className={style.body}>
          <Swiper
            className={style.balloonSwiper}
            slidesPerView={'auto'}
            loop={false}
            centeredSlides={true}
            style={{ overflow: 'visible' }}
          >
            {ContentSwiperSlide()}
          </Swiper>
          <div className={style.prevNextBtnWrapper}>
            {prevBalloonData ? (
              <CustomButton
                className={style.btnPrev}
                onClick={handlePrevBalloon}
              >
                <Icon name="Arrow_Left_L" />
              </CustomButton>
            ) : (
              <div></div>
            )}
            {nextBalloonData ? (
              <CustomButton
                className={style.btnNext}
                onClick={handleNextBalloon}
              >
                <Icon name="Arrow_Right_L" />
              </CustomButton>
            ) : (
              <div></div>
            )}
          </div>
          <CustomButton onClick={handleList} className={style.btnList}>
            <Text locale={{ textId: 'GMY.000057' }} defaultValue="목록" />
          </CustomButton>
        </div>

        <Button size="full" shape="rect" onClick={handleWrite}>
          <Text locale={{ textId: 'GMY.000050' }} defaultValue="풍선 날리기" />
        </Button>
      </div>

      <SelectOffCanvas
        isOpen={isOptionMenuShow}
        isIconButton={true}
        buttonList={bottomMenus}
        onClose={() => {
          setIsOptionMenuShow(false);
        }}
      ></SelectOffCanvas>
    </Modal>
  );
};
export default BalloonReadFullScreenModal;
