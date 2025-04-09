import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import { useState } from 'react';
import MemoCreate from './MemoCreate';
import usePopup from '@/common/hooks/Popup/usePopup';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';

interface IMemoCreateModal extends Omit<ModalProps, 'onRequestClose'> {
  text?: string;
  onComplete: (text: string) => boolean;
}
const MemoCreateModal = ({
  text = '',
  onComplete,
  onRequestClose,
}: IMemoCreateModal) => {
  const [memoValue, setMemoValue] = useState(text);
  const { showConfirmPopup, showToastPopup } = usePopup();
  const handleSave = async () => {
    const success = await onComplete(memoValue);
    if (!success) {
      showToastPopup({
        titleText: <Text text="#나중에 다시 시도해주세요." />,
      });
      return;
    }
    showToastPopup({
      titleText: (
        <Text
          locale={{ textId: 'GMY.000151' }}
          defaultValue="메모가 게시되었습니다"
        />
      ),
    });
    onRequestClose();
  };
  const handleBack = () => {
    if (memoValue !== text) {
      showConfirmPopup({
        titleText: (
          <Text
            locale={{ textId: 'GCM.000017' }}
            defaultValue="나가면 편집한 내용이 저장되지 않고 사라집니다."
          />
        ),
        onConfirm: onRequestClose,
      });
      return;
    }
    onRequestClose();
  };
  return (
    <Modal isOpen={true} className={style.memoCreateModalWrapper}>
      <div className={style.memoCreateModal}>
        <div className={style.header}>
          <CircleButton shape="circle" size="s" onClick={handleBack}>
            <Icon name="Close_Bottom_S" />
          </CircleButton>
          <Button variant="tertiary" id="ga-memo-create" onClick={handleSave}>
            <Text locale={{ textId: 'GCM.000015' }} defaultValue="저장" />
          </Button>
        </div>
        <MemoCreate text={memoValue} setText={setMemoValue} />
      </div>
    </Modal>
  );
};

export default MemoCreateModal;
