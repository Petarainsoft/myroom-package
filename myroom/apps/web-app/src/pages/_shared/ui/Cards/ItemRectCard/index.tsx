import CustomButton from '@/components/Buttons/CustomButton';
import styles from './styles.module.scss';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import classNames from 'classnames';

export type ItemRectangleCardProps = {
  selected?: boolean;
  thumbnail?: string;
  onClick?: () => void;
  text?: string;
  desc?:string;
};

export const ItemRectCard = ({
  thumbnail,
  selected,
  text,
  desc,
  onClick,
}: ItemRectangleCardProps) => {
  return (
    <CustomButton className={classNames(styles['wrap'])} onClick={onClick}>
      <div className={styles['thumbnail']} style={{ backgroundImage: `url('${thumbnail}')` }} />
      <div className={styles['text']}>
        {text}
      </div>
      {(desc || selected) && <div className={styles['info']}>
        {selected? <Icon name='On' className={styles['icon']}/> : <span>{desc}</span>}
      </div>}
    </CustomButton>
  );
};

export type ItemRectanglePlusCardProps = {
  max?: number;
  count?: number;
  onClick?: () => void;
};

export const ItemRectPlusCard = ({
  count,
  max,
  onClick,
}: ItemRectanglePlusCardProps) => {
  return (
      <CustomButton onClick={onClick} className={classNames(styles['wrap'], styles['add-button'])} >
        <div className={styles['icon']}>
          <Icon name="Category_Plus" />
        </div>
        <div className={styles['saveCoordiText']}>
          <Text locale={{ textId: 'GMY.000080' }} />
        </div>
        <div className={styles['count']}>
          {count}/{max}
        </div>
      </CustomButton>
  );
};
