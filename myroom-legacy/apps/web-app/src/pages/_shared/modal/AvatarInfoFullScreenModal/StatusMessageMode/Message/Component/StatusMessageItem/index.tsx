import useModal from '@/common/hooks/Modal/useModal';
import { EditedStatusMessageInputAtom } from '@/common/stores';
import { useAtomValue } from 'jotai';
import Text from '@/components/Text';

import style from './style.module.scss';
import Icon from '@/components/Icon';

interface IStatusMessageItem {}
const StatusMessageItem = ({}: IStatusMessageItem) => {
  const editedStatusMessageInput = useAtomValue(EditedStatusMessageInputAtom);
  const StatusMessageEditModal = useModal('StatusMessageEditModal');

  const handleMessageEdit = () => {
    StatusMessageEditModal.createModal();
  };
  // 입력된 상태 메시지 없는 경우
  if (!editedStatusMessageInput) {
    return (
      <div
        className={style.statusMessageEditItemNone}
        onClick={() => {
          handleMessageEdit();
        }}
      >
        <div className={style.iconWrapper}>
          <Icon name={'Action_Message_S'} />
        </div>

        <Text locale={{ textId: 'GMY.000005' }} defaultValue="상태 입력" />
      </div>
    );
  }

  // 입력된 상태 메시지 있는 경우
  return (
    <div
      onClick={handleMessageEdit}
      className={style.statusMessageEditItemExist}
    >
      <p>{editedStatusMessageInput}</p>
    </div>
  );
};

export default StatusMessageItem;
