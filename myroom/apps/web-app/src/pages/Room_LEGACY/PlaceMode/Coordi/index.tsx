import React from 'react';
import classNames from 'classnames';
import useCoordi from './hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import styles from './styles.module.scss';
import { ItemRectCard, ItemRectPlusCard } from '@/pages/_shared/ui/Cards/ItemRectCard';

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


type CoordiProps = {
  data: any;
}

const Coordi = ({ data}: CoordiProps) => {
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
    console.log('Coordi@@ ' ,);
  }, []);

  return (
    <>
      {data._id === 'PLUS' 
        ? <ItemRectPlusCard onClick={handleClickAddCoordi} max={5} count={data.count} /> 
        : <ItemRectCard thumbnail={data.resource.thumbnail} onClick={handleClickCoordi(data._id)}/>
      }
      {/* <ul className={styles['wrap']}>
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
      /> */}
    </>
  );
};

export default Coordi;
