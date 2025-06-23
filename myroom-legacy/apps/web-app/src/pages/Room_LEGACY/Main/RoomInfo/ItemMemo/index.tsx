import BalloonMessage from '@/pages/_shared/ui/BalloonMessage';
import style from './style.module.scss';
interface IItemMemo {
  text: string;
}
const ItemMemo = ({ text }: IItemMemo) => {
  return (
    <BalloonMessage
      className={style.balloonMessage}
      iconName="Memo_Noti_M"
      messageText={text}
    />
  );
};

export default ItemMemo;
