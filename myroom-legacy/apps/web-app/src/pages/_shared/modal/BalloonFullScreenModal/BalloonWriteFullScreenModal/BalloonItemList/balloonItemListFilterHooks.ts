import useItemAPI from '@/apis/Meta/Item';
import { ItemData } from '@/apis/Meta/Item/type';
import { WORLD_ID } from '@/common/constants';
import {
  EItemCategory3,
  EPriceType,
} from 'client-core/tableData/defines/System_Enum';
import { MouseEvent, useEffect, useState } from 'react';

const useBalloonItemListFilter = () => {
  const [listType, setListType] = useState<string>('all');
  const { data: balloonItemsRes } = useItemAPI().fetchItems({
    w: WORLD_ID,
    category: EItemCategory3.BALLOON.toString(),
    limit: 100,
  });
  const [balloonItemList, setBalloonItemList] = useState<
    ItemData[] | undefined
  >(balloonItemsRes?.list);
  useEffect(() => {
    if (!balloonItemsRes) return;
    if (listType === 'all') {
      setBalloonItemList(balloonItemsRes.list);
    } else {
      const isFree = listType === 'free';
      setBalloonItemList(
        balloonItemsRes.list.filter((_) =>
          isFree
            ? _.option.price.type === EPriceType.FREE
            : _.option.price.type !== EPriceType.FREE,
        ),
      );
    }
  }, [listType, balloonItemsRes]);
  const handleChangeListType = (e: MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget) return;
    setListType(e.currentTarget.value);
  };
  return { listType, balloonItemList, handleChangeListType };
};
export default useBalloonItemListFilter;
