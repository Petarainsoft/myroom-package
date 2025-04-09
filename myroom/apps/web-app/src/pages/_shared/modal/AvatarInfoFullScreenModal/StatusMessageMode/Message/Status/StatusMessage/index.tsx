import { isOpenMessageInputEditModalAtom } from '@/common/stores';
import DeleteStatusButton from '../../Component/DeleteButton';
import StatusMessageItem from '../../Component/StatusMessageItem';
import style from './style.module.scss';
import { useAtom } from 'jotai';

const StatusMessage = () => {
  const [isOpenMessageInputEditModal] = useAtom(
    isOpenMessageInputEditModalAtom,
  );
  if (isOpenMessageInputEditModal) return <></>;
  return (
    <div className={style.statusWrapper}>
      <StatusMessageItem />
      <DeleteStatusButton />
    </div>
  );
};

export default StatusMessage;
