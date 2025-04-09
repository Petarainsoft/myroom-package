import useCoordiAPI from '@/apis/Space/Coordi';
import usePopup from '@/common/hooks/Popup/usePopup';
import { useCallback, useMemo, useState } from 'react';
import { t } from 'i18next';
import useThumbnail from '@/common/hooks/use-thumbnail';
import { ISelectButton } from '@/pages/_shared/offcanvas/SelectOffCanvas';
import { SceneManager } from '@/common/utils/client';
import { currentEquipItemsAtom } from '../../store';
import { useSetAtom } from 'jotai';

type useCoordiProps = {
  data: any;
}

const useCoordi = ({ data } : useCoordiProps) => {
  const { showConfirmPopup, showToastPopup } = usePopup();
  const { mutationPostCoordis, mutationDelCoordi } = useCoordiAPI();
  const setCurrentEquipItems = useSetAtom(currentEquipItemsAtom);
  
  const { createThumbnail } = useThumbnail();

  const [isShowCoodiMenu, setIsShowCoodiMenu] = useState(false);


  const handleClickWearCoordi = useCallback(() => {
    if (data) {
      data.option?.items?.map((x: string) => SceneManager.Avatar?.equipAvatarItem(x, () => { }));

      SceneManager.Avatar?.getAllAvatarEquipItems((ids) => {
        setCurrentEquipItems([...ids]);
      });
      
      setIsShowCoodiMenu(false);
    }
  }, [data, setCurrentEquipItems]);

  const handleClickCoordi = useCallback(() => { 
    setIsShowCoodiMenu(true);
  }, []);

  const handleCloseCoordi = useCallback(() => { 
    setIsShowCoodiMenu(false);
  }, []);

  const handleClickAddCoordi = useCallback(async () => {
    // //- 코디 슬롯 체크
    // if (coordiCount >= 5) {
    //   showToastPopup({ titleText: t('GMY.000087') });
    //   return;
    // }

    //- 동일 코디 확인
    // if (coordiListData && coordiCount > 0) {
    //   for (let coordi of coordiListData.list) {
    //     const diff = coordi.option.items.filter(
    //       (x: string) => !items.includes(x),
    //     );
    //     if (diff.length <= 0) {
    //       showToastPopup({ titleText: t('GMY.000088') });
    //       return;
    //     }
    //   }
    // }

    //- 미구매 항목 확인(미작업)
      console.log('');
    //- 스샷
    createThumbnail(SceneManager.Avatar, async (id: string) => {
          SceneManager.Avatar?.getAllAvatarEquipItems(async (ids) => {
            await mutationPostCoordis.mutateAsync({
                data: {
                  option: { items: [...ids] },
                  resource: {
                    thumbnail: id,
                  },
                },
              });
         });
    });
  }, [createThumbnail, mutationPostCoordis]);

  const handleClickRemove = useCallback(async () => {
    if (data) {
      await mutationDelCoordi.mutateAsync({ id: data._id });
      setIsShowCoodiMenu(false);
    }
  }, [data, mutationDelCoordi]);

  const handleClickRemoveConfirm = useCallback(async () => {
    showConfirmPopup({
      titleText: t('GMY.000042'),
      onConfirm: handleClickRemove,
    });
  }, [handleClickRemove, showConfirmPopup]);

  const actions = useMemo(() => {
    const actions: ISelectButton[] = [
      {
        textId: 'GMY.000137',
        onClick: handleClickWearCoordi,
      },
      {
        textId: 'GMY.000082',
        onClick: handleClickRemoveConfirm,
      },
    ];

    return actions;
  }, [handleClickWearCoordi, handleClickRemoveConfirm]);

  return {
    // coordiListData,
    // selectedCoordi,
    // actions,
    // coordiCount,
    // handleClickCoordi,
    // handleClickCancel,
    actions,
    isShowCoodiMenu,
    handleClickCoordi,
    handleClickAddCoordi,
    handleCloseCoordi
  };
};

export default useCoordi;
