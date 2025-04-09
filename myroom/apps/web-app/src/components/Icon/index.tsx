import { ReactSVG } from 'react-svg';
import { BASE_IMG_URL } from '@/common/constants';
import styles from './styles.module.scss';
import classNames from 'classnames';

export type IconProps = {
  name?: string;
  baseUrl?: string;
  src?:string;
  className?: string;
  badge?: {
    isActive?: boolean;
  };
};

const Icon = ({ name, baseUrl, src, className, badge }: IconProps) => {
  return (
    <div className={classNames(styles['wrap'], className)}>
      {badge && (
        <div
          className={classNames(styles['badge'], {
            [styles['active']]: badge.isActive,
          })}
        />
      )}
      {src?<ReactSVG
        src={src}
        className={styles['icon']}
        />:<ReactSVG
        src={`${baseUrl ? baseUrl : BASE_IMG_URL}/${name}.svg`}
        className={styles['icon']}
      />}
      
    </div>
  );
};

export default Icon;
