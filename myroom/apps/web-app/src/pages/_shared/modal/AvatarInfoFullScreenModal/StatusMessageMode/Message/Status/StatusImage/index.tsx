import DeleteStatusButton from '../../Component/DeleteButton';
import StatusImageItem from '../../Component/StatusImageItem';
import style from './style.module.scss';

const StatusImage = () => {
  return (
    <div className={style.statusWrapper}>
      <StatusImageItem />
      <DeleteStatusButton />
    </div>
  );
};

export default StatusImage;
