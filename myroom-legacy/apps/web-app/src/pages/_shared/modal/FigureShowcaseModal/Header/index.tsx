import style from './style.module.scss';
import Text from '@/components/Text';

interface IHeader {
  nick: string;
  headerTitle: string;
}
const Header = ({ headerTitle, nick }: IHeader) => {
  return (
    <div className={style.figureShowcaseHeaderWrapper}>
      <div className={style.flex}>
        <div className={style.figureHeaderTitle}>
          <Text text={headerTitle} isLoading={!headerTitle} />
        </div>
        <div className={style.figureHeaderNickname}>
          <Text text={nick} isLoading={!nick} />
        </div>
      </div>
    </div>
  );
};

export default Header;
