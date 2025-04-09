import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './styles.module.scss';
import {
  EditedStatusMessageInputAtom,
  isOpenMessageInputEditModalAtom,
  statusMessageTempInputAtom,
} from '@/common/stores';
import { useAtom } from 'jotai';
import StatusMessageEdit from './StatusMessageEdit';
import { useEffect } from 'react';
import Button from '@/components/Buttons/Button';
import View from '../../layouts/View';

interface IStatusMessageEditModal extends Omit<ModalProps, 'onRequestClose'> {}
const StatusMessageEditModal = ({
  onRequestClose,
}: IStatusMessageEditModal) => {
  const [statusMessageITempInput, setStatusMessageTempInput] = useAtom(
    statusMessageTempInputAtom,
  );

  const [editedStatusMessageInput, setEditedStatusMessageInput] = useAtom(
    EditedStatusMessageInputAtom,
  );
  const [, setIsOpenMessageInputEditModal] = useAtom(
    isOpenMessageInputEditModalAtom,
  );
  const handleSaveStatusMessage = () => {
    setEditedStatusMessageInput(statusMessageITempInput);
    onRequestClose();
  };

  const handleCloseModal = () => {
    setStatusMessageTempInput(editedStatusMessageInput);
    onRequestClose();
  };

  useEffect(() => {
    setIsOpenMessageInputEditModal(true);
    setStatusMessageTempInput(editedStatusMessageInput);
    return () => {
      setIsOpenMessageInputEditModal(false);
    };
  }, []);

  return (
    <Modal isOpen={true}>
      <View
        fixed
        headerOptions={
          {
            float: true,
            closeOptions: {
              onClick: handleCloseModal,
              icon: "x",
            },
            endArea: <Button size='m' variant='default' onClick={handleSaveStatusMessage}>
              확인
            </Button>
          }
        }
      >
        <div className={style.EditWrapper}>
          <StatusMessageEdit />
        </div>
        <div className={style.bottomMargin} />
      </View>
    </Modal>
  );
};

export default StatusMessageEditModal;
