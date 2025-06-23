import style from './style.module.scss';

interface IStatusMessageText {
  text: string;
}
const StatusMessageText = ({ text }: IStatusMessageText) => {
  return (
    <div className={style.statusMessageText}>
      <p>{text}</p>
    </div>
  );
};

export default StatusMessageText;
