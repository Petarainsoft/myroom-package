import LottieComponent from '@/components/Lottie';
import { useEffect } from 'react';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './styles.module.scss';
import useModal from '@/common/hooks/Modal/useModal';
import Skeleton from '@/components/Skeleton';

interface ILoadingProps extends Omit<ModalProps, 'onRequestClose'> {
  limitSec?: number;
}

const LoadingFullScreenModal = ({ limitSec = 300 }: ILoadingProps) => {
  const LoadingFullScreenModal = useModal('LoadingFullScreenModal');
  useEffect(() => {
    const timer = setTimeout(() => {
      LoadingFullScreenModal.deleteModal();
    }, limitSec * 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal
      isOpen={true}
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
    >
      <div className={style.loadingModal}>
        <Skeleton>
          <LottieComponent className={style.lottie} name="animation_loading" />
        </Skeleton>
      </div>
    </Modal>
  );
};

export default LoadingFullScreenModal;
