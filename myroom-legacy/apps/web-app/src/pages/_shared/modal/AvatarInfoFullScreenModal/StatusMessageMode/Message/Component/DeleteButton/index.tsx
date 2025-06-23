import {
  EditedStatusImageAtom,
  EditedStatusMessageInputAtom,
  copiedStatusImageIdAtom,
  statusMessageTempInputAtom,
} from '@/common/stores';
import Icon from '@/components/Icon';
import { useSetAtom } from 'jotai';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
interface IDeleteStatusButton {}
const DeleteStatusButton = ({}: IDeleteStatusButton) => {
  const setEditedStatusImage = useSetAtom(EditedStatusImageAtom);
  const setStatusMessageInput = useSetAtom(EditedStatusMessageInputAtom);
  const setStatusMessageTempInput = useSetAtom(statusMessageTempInputAtom);
  const setCopiedStatusImageId = useSetAtom(copiedStatusImageIdAtom);
  const handleDeleteStatus = () => {
    setStatusMessageInput('');
    setEditedStatusImage(null);
    setStatusMessageTempInput('');
    setCopiedStatusImageId('');
  };

  return (
    <div className={style.messageStatusDeleteBtn}>
      <CircleButton shape="circle" size="xxs" onClick={handleDeleteStatus}>
        <Icon name="Close_Bottom_S" />
      </CircleButton>
    </div>
  );
};

export default DeleteStatusButton;
