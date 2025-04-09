import CustomButton from '@/components/Buttons/CustomButton';
import useCoordi from './hooks';
import styles from './styles.module.scss';
import classNames from 'classnames';
import React from 'react';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';

type ItemProps = {
  id: string;
  image: string;
  onClick: (id: string) => void;
};
const Item = ({ id, image, onClick }: ItemProps) => {
  return (
    <li
      key={id}
      className={styles['item-box']}
      style={{ backgroundImage: `url(${image}.png)` }}
      onClick={() => onClick(id)}
    ></li>
  );
};

const Coordi = () => {
  const {
    coordiCount,
    coordiListData,
    selectedId,
    actions,
    handleClickCancel,
    handleClickAddCoordi,
    handleClickCoordi,
  } = useCoordi();

  React.useEffect(() => {
    console.log('Coordi@@');
  }, []);

  return (
    <>
      <ul className={styles['wrap']}>
        <li className={classNames(styles['item-box'], styles['add'])}>
          <CustomButton
            onClick={handleClickAddCoordi}
            className={styles['add-button']}
          >
            <div className={styles['icon']}>
              <Icon name="Category_Plus" />
            </div>
            <Text locale={{ textId: 'GMY.000080' }} />
            <div className={styles['count']}>{coordiCount}/5</div>
          </CustomButton>
        </li>
        {coordiListData?.list?.map((item: any) => (
          <Item
            id={item._id}
            image={item.resource.thumbnail}
            onClick={handleClickCoordi}
          />
        ))}
      </ul>
      <SelectOffCanvas
        isOpen={selectedId !== undefined}
        onClose={handleClickCancel}
        buttonList={actions}
        isIconButton={false}
      />
    </>
  );
};

export default Coordi;
