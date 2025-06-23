import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { useNavigate } from 'react-router-dom';
import style from './style.module.scss';
import Text from '@/components/Text';

interface IRoomEntryButton {
  isActive: boolean;
  roomId: string;
  onClick: () => void;
}

const RoomEntryButton = ({ isActive, roomId, onClick }: IRoomEntryButton) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
    navigate(`/rooms/${roomId}`);
    location.reload();
  };

  if (!isActive) return <></>;
  return (
    <div className={style.entryButtonWrapper}>
      <CustomButton onClick={() => handleClick()} className={style.button}>
        <div className={style.iconWrapper}>
          <Icon name="ImgUP_M" />
        </div>
        <Text locale={{ textId: 'GMY.000004' }} defaultValue="마이룸" />
      </CustomButton>
    </div>
  );
};

export default RoomEntryButton;
