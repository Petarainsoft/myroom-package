import { BASE_IMG_URL } from '@/common/constants';
import CircleButton from '@/components/Buttons/CircleButton';
import styles from './styles.module.scss';
import classNames from 'classnames';

export type ProfileProps = {
  className?: string;
  src?: string | null;
  size: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'xxxl';
  shape?: 'circle' | 'circle-bl' | 'circle-br';
  onClick?: () => void;
};

const Profile = ({
  src = `${BASE_IMG_URL}/Profile_M.svg`,
  shape = 'circle',
  ...rest
}: ProfileProps) => {
  return (
    <CircleButton   shape={shape} {...rest}>
      <div
        className={classNames(styles['container'])}
        style={{ backgroundImage: `url(${src})` }}
      ></div>
    </CircleButton>
  );
};

export default Profile;
