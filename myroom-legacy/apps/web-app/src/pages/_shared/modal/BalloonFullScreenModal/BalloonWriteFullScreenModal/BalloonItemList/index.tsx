import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import useBalloonItemList from './hooks';
import BalloonItemCell from '../BalloonItemCell';
import { EPriceType } from 'client-core';
import { getPriceIcon } from '@/pages/_shared/popup/GoodsPopup';
import Text from '@/components/Text';
import { useCallback, useLayoutEffect, useState } from 'react';
import Image from '@/components/Image';

const BalloonItemList = () => {
  const {
    letterBG,
    listType,
    handleChangeListType,
    balloonItemList,
    selectedBalloonItemData,
    handleShowBalloonSelectUI,
    handleSelectBalloon,
  } = useBalloonItemList();

  const selectedBalloonThumbnail = () => {
    return selectedBalloonItemData?.resource.thumbnail ?? '';
  };
  const [priceType, setPriceType] = useState(0);

  const selectedBalloonPrice = useCallback(() => {
    return selectedBalloonItemData?.option.price;
  }, [selectedBalloonItemData]);
  const ListTypeButton = ({
    type,
    btnTextId,
  }: {
    type: string;
    btnTextId: string;
  }) => {
    return (
      <CustomButton
        className={`${style.btnListType} ${
          listType === type ? style.on : style.off
        }`}
        onClick={handleChangeListType}
        value={type}
      >
        <Text locale={{ textId: btnTextId }} />
      </CustomButton>
    );
  };
  useLayoutEffect(() => {
    if (!selectedBalloonItemData) return;
    setPriceType(selectedBalloonItemData.option.price.type);
  }, [selectedBalloonItemData]);
  return (
    <div className={style.wrapper}>
      <div className={style.listType}>
        <div className={style.scrollArea}>
          <ListTypeButton type="all" btnTextId="GCM.000008" />
          <ListTypeButton type="free" btnTextId="GMY.000046" />
          <ListTypeButton type="paid" btnTextId="GMY.000047" />
        </div>
        <div className={style.rightSide}>
          <CustomButton onClick={handleShowBalloonSelectUI}>
            <Icon name="AllMenu_M" />
          </CustomButton>
        </div>
      </div>
      <div className={style.list}>
        {balloonItemList
          ? balloonItemList.map((data) => (
              <BalloonItemCell
                className={style.balloonItem}
                selectedId={selectedBalloonItemData?._id ?? ''}
                key={data._id}
                data={data}
                handleClick={handleSelectBalloon}
              />
            ))
          : null}
      </div>
      <div
        className={style.preview}
        style={{
          backgroundColor: letterBG,
        }}
      >
        <div className={style.triangle}>
          <Icon name='Page_Semo'/>
        </div>
        <div className={style.previewBalloon}>
          <Image src={selectedBalloonThumbnail()}/>
        </div>
        <div className={style.priceWrapper}>
          {priceType === EPriceType.FREE ? null : (
            <div className={style.priceIcon}>
              <Icon name={getPriceIcon(priceType ?? EPriceType.FREE)} />
            </div>
          )}
          <div className={style.priceText}>
            {priceType === EPriceType.FREE ? (
              <Text locale={{ textId: 'GMY.000046' }} />
            ) : (
              selectedBalloonPrice()?.amount
            )}
          </div>
          
        </div>
      </div>
      <div className={style.desc}>
        <Icon name="check" />
        <span>
          <Text
            locale={{
              textId: `${
                priceType === EPriceType.FREE ? 'GMY.000048' : 'GMY.000049'
              }`,
            }}
            hasTag
          />
        </span>
      </div>
    </div>
  );
};
export default BalloonItemList;
