import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import CircleButton from '@/components/Buttons/CircleButton';
import CanvasScene from '../../ui/CanvasScene';
import useProfileCard from './hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import InputText from '@/components/Forms/InputText';
import ProfileCard from './ProfileCard';
interface IProfileFullScreenModal extends Omit<ModalProps, 'onRequestClose'> {
  profileId:string;
}
const ProfileCardFullScreenModal = ({
  profileId,
  onRequestClose,
}: IProfileFullScreenModal) => {
  
  const { userName, cardManifestList, currentCardIndex, cardSwiperRef, hiddenAnchorRef, avatarImageData, onAfterSceneReady, handleNextAvatarAction, handlePrevCard, handleNextCard, handleCardSwiperChanged, handleSave, handleShare } =
    useProfileCard(profileId);  
  const [isEditMode, setIsEditMode] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const customMessageInputRef = useRef<HTMLInputElement>(null);
  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton
          size="s"
          onClick={() => {
            onRequestClose();
          }}
        >
          <Icon name="Top_Arrow_left_S" />
        </CircleButton>
        <CustomButton className={style.btnEdit}
          onClick={()=>{setIsEditMode(true);}}
        >
          <Icon name='Txt_Edit_S' className={style.icon}/>
          <div className={style.text}>편집</div>
        </CustomButton>
      </div>
    );
  };
  const EditModeHeader = ()=>{
    return(
      <div className={style.header}>
        <CircleButton
          size="s"
          onClick={() => {
            setIsEditMode(false);
          }}
        >
          <Icon name="Close_M" />
        </CircleButton>
        <CustomButton className={style.btnEditConfirm}
          onClick={
            ()=>{
              setIsEditMode(false);
              if(customMessageInputRef.current)
                setCustomMessage(customMessageInputRef.current.value);
            }
          }
        >
          <div className={style.text}>완료</div>
        </CustomButton>
      </div>
    );
  };
  return (
    <Modal isOpen={true}>
      <div className={style.hiddenArea}>
        <a ref={hiddenAnchorRef}></a>
        <div className={style.canvasWrapper}>
          <CanvasScene
            className={style['scene-container']}
            onAfterSceneReady={onAfterSceneReady}
            type={'AVATAR'}
          />
        </div>
      </div>
      <div className={style.profileCardWrapper}>
        {isEditMode?null:<Header/>}
        <div className={style.body}>
          <Swiper
            pagination={{ type: 'progressbar' }}
            slidesPerView={1}
            className={style.cardSwiper}
            ref={cardSwiperRef}
            onSlideChange={handleCardSwiperChanged}
          >
            {cardManifestList.map((data, i)=>
            <SwiperSlide>
              {/* <Card data = {data}/> */}
              <ProfileCard key={i} data = {data} userName={userName??''} customMessage={customMessage} avatarImageData={avatarImageData} handleNextAvatarAction={handleNextAvatarAction}/>
            </SwiperSlide>)}
          </Swiper>
          <div className={style.swiperPagingBtnWrapper}>
            <CustomButton onClick={handlePrevCard} className={style.btnSwiperPaging}>
              <Icon name="Arrow_Left_L" />
            </CustomButton>
            <CustomButton onClick={handleNextCard} className={style.btnSwiperPaging}>
              <Icon name="Arrow_Right_L" />
            </CustomButton>
          </div>
          <div className={style.swiperProgressWrapper}>
            <div className={style.progressBg}>
              <div className={style.progressBar} style={{width:`${((currentCardIndex+1)/cardManifestList.length)*100}%`}}></div>
            </div>
            <div className={style.progressTextWrapper}>
              <div className={style.progressCurrent}>{currentCardIndex+1}</div>
              <div className={style.progressTotal}>/{cardManifestList.length}</div>
            </div>
          </div>

          <div className={style.bottomBtnWrapper}>
            <CustomButton onClick={handleSave} className={style.btnSave}>
              <Icon name='Save_Card_S' className={style.bottomBtnIcon}/>
              <div className={style.bottomBtnText}>저장</div>
            </CustomButton>
            <CustomButton onClick={handleShare} className={style.btnShare}>
              <Icon name='Share_S' className={style.bottomBtnIcon}/>
              <div className={style.bottomBtnText}>공유</div>
            </CustomButton>
          </div>
        </div>
        {isEditMode?
        <div className={style.editModeDimmedLayer}>
          <EditModeHeader/>
          <div className={style.textEditInputWrapper}>
            <InputText type='text' className={style.inputText} ref={customMessageInputRef}/>
            <CircleButton size='s' shape='none'>
              <Icon name='Close_Bottom_S'/>
            </CircleButton>
          </div>
        </div>:null}
        
        
        
      </div>
      
    </Modal>
  );
};
export default ProfileCardFullScreenModal;
