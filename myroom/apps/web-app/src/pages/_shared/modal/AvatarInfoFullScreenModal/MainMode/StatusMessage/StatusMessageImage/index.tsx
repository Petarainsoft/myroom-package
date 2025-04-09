import useModal from '@/common/hooks/Modal/useModal';
import style from './style.module.scss';
import Image from '@/components/Image';
interface IStatusMessageImage {
  id: string;
}
const StatusMessageImage = ({ id }: IStatusMessageImage) => {
  const ImageFullScreenModal = useModal('ImageFullScreenModal');

  const statusImageSrc = id;

  const handleOpenImageFullScreen = async () => {
    ImageFullScreenModal.createModal({
      id,
    });
  };

  if (!statusImageSrc) return <></>;

  return (
    <div className={style.statusImage} onClick={handleOpenImageFullScreen}>
      <Image src={statusImageSrc!} alt="statusImage" />
    </div>
  );
};

export default StatusMessageImage;
