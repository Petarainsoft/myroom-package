import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import styles from './styles.module.scss';
import classNames from 'classnames';

type Tab = {
  textId: string;
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
};

export type TabsProps = {
  elements: Tab[];
};

const Tabs = ({ elements }: TabsProps) => {
  return (
    <div className={styles['wrap']}>
      {elements.map((element) => (
        <CustomButton
          key={element.textId}
          className={classNames(styles['tab'], {
            [styles['selected']]: element.selected,
          })}
          onClick={element.onClick}
        >
          <div className={styles['item']}>
            {element.icon && (
              <Icon
                name={element.icon}
                badge={{ isActive: element.selected }}
                className={styles['icon']}
              />
            )}
            <Text locale={{ textId: element.textId }} />
          </div>
        </CustomButton>
      ))}
    </div>
  );
};

export default Tabs;
