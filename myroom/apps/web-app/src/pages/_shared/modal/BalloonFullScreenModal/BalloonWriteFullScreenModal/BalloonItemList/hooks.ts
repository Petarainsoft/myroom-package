import { selectedBalloonItemDataAtom } from '@/common/stores';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import useBalloonItemTable from '../../Hooks/useBalloonItemTable';
import useBalloonItemListFilter from './balloonItemListFilterHooks';
import useModal from '@/common/hooks/Modal/useModal';
import useBalloonsAPI from '@/apis/Social/Balloons';
import usePopup from '@/common/hooks/Popup/usePopup';
import { EPriceType } from 'client-core';
import { getLocaleText } from '@/common/utils/text';

const MAX_FREE_BALLOON_NUM = 1000;
const useBalloonItemList = () => {
  const { listType, balloonItemList, handleChangeListType } =
    useBalloonItemListFilter();
  const [selectedBalloonItemData, setSelectedBalloonItemData] = useAtom(
    selectedBalloonItemDataAtom,
  );
  const { letterBG } = useBalloonItemTable(selectedBalloonItemData?._id ?? '');
  const BalloonItemSelectFullScreenModal = useModal(
    'BalloonItemSelectFullScreenModal',
  );
  const { showToastPopup } = usePopup();
  const usedFreeBalloonNum =
    useBalloonsAPI().fetchMeFreeBalloon().data?.data.free_balloon.count ?? 0;

  useEffect(() => {
    if (!balloonItemList || balloonItemList.length <= 0) {
      return;
    }
    if (!selectedBalloonItemData && balloonItemList[0]) {
      if (usedFreeBalloonNum < MAX_FREE_BALLOON_NUM)
        setSelectedBalloonItemData(balloonItemList[0]);
      else {
        const data = balloonItemList.find(
          (item) => item.option.price.type !== EPriceType.FREE,
        );
        setSelectedBalloonItemData(data);
      }
    }
  }, [balloonItemList, selectedBalloonItemData]);

  const handleSelectBalloon = (balloonId: string) => {
    const balloonData = balloonItemList?.find((item) => item._id === balloonId);
    if (
      balloonData?.option.price.type === EPriceType.FREE &&
      usedFreeBalloonNum >= MAX_FREE_BALLOON_NUM
    ) {
      showToastPopup({
        titleText: getLocaleText('GMY.000066', null, true),
      });
    } else {
      setSelectedBalloonItemData(balloonData);
    }
    return;
  };
  const handleShowBalloonSelectUI = () => {
    BalloonItemSelectFullScreenModal.createModal({
      initSelectedBalloonId: selectedBalloonItemData,
      handleSelectFinished: handleSelectBalloon,
    });
  };

  return {
    letterBG,
    listType,
    handleChangeListType,
    balloonItemList,
    selectedBalloonItemData,
    handleShowBalloonSelectUI,
    handleSelectBalloon,
  };
};
export default useBalloonItemList;
