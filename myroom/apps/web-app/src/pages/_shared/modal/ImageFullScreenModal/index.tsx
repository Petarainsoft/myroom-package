import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './styles.module.scss';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import CustomButton from '@/components/Buttons/CustomButton';
interface IImageFullScreenModal extends Omit<ModalProps, 'onRequestClose'> {
  editedImageSrc?: string;
  id?: string;
}

const ImageComponent = ({
  imageSrc,
  id,
}: {
  imageSrc?: string;
  id?: string;
}) => {
  console.log(id); //TODO:삭제
  const src = imageSrc ? imageSrc : id;
  return (
    <div className={style.imageFullScreenImageWrapper}>
      <img src={src} alt="image" />
    </div>
  );
};

const ImageFullScreenModal = ({
  // handleClose,
  editedImageSrc,
  id,
  onRequestClose,
}: IImageFullScreenModal) => {
  return (
    <Modal isOpen={true} styles={{ overlay: { background: '#1E1E1E' } }}>
      <div className={style.imageFullScreenWrapper}>
        <div className={style.imageFullScreenButtonWrapper}>
          <CustomButton className={style.closeBtn} onClick={onRequestClose}>
            <Icon name="Top_Close" />
          </CustomButton>
          <CustomButton className={style.confirmBtn} onClick={onRequestClose}>
            <Text locale={{ textId: 'GCM.000003' }} defaultValue="확인" />
          </CustomButton>
        </div>
        <ImageComponent imageSrc={editedImageSrc} id={id} />
      </div>
    </Modal>
  );
};

export default ImageFullScreenModal;
