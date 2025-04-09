import { useCallback, useEffect, useState } from 'react';
import { SceneManager } from '@/common/utils/client';
import { EFuntionType } from 'client-core/tableData/defines/System_Enum';
import usePopup from '@/common/hooks/Popup/usePopup';
import useModal from '@/common/hooks/Modal/useModal';
import useScene from '@/common/hooks/use-scene';
import { itemFunctionDataAtom } from './store';
import { useSetAtom } from 'jotai';

const useItemFullScreenModal = (itemId: string, itemInstanceId?:string) => {
  const ItemFullScreenModal = useModal('ItemFullScreenModal');
  const {sceneStatus, setSceneStatus} = useScene();
  const { showToastPopup } = usePopup();
  const setItemFunctionData = useSetAtom(itemFunctionDataAtom);
  const [itemFunctionType, setItemFunctionType] = useState<EFuntionType>(
    EFuntionType.NONE,
  );

  /**
 *  아이템 기능설정 초기화
 */
  const handleClickReset = useCallback(() => {
    setItemFunctionData(null);

    SceneManager.Item?.doItemFunction(null);
  }, [setItemFunctionData]);

  const handleCloseModal = useCallback(() => {
    ItemFullScreenModal.deleteModal();
  }, [ItemFullScreenModal]);

  const handleClickSave = useCallback(() => {
    if (itemInstanceId) {
      SceneManager.Item?.getItemController((controller) => {
        const data = controller?.getItemFunctionData();
        if (data) {
          SceneManager.Room?.doItemFunction_MyRoom(itemInstanceId, {
            instanceId: itemInstanceId,
            functionData: data.functionData,
            linkAlias: data.linkAlias,
            linkUrl: data.linkUrl,
            mediaType: data.mediaType,
          });
        } else {
          SceneManager.Room?.doItemFunction_MyRoom(itemInstanceId, null);
        }
  
        showToastPopup({ titleText: '#저장 되었습니다.' });
  
        ItemFullScreenModal.deleteModal();
      });
    }
  }, [ItemFullScreenModal, showToastPopup, itemInstanceId]);


  /**
   *
   */
  const onAfterInitScene = useCallback(() => {
      setSceneStatus('INITIALIZED');
  },[]);

  useEffect(()=>{
    if(sceneStatus === 'INITIALIZED') {
      SceneManager.Item?.initializeItem(itemId, () => {
        const itemTable = SceneManager.Item?.getItemTableData(itemId);
        if (itemTable) {
          setItemFunctionType(itemTable.funtion);
        }

        if (itemInstanceId) {
          SceneManager.Room?.findItemController(
            itemInstanceId,
            (roomController) => {
              const data = roomController?.getItemFunctionData();
              if (data) {
                SceneManager.Item?.getItemController((itemController) => {
                  if (itemController) {
                    const doData = {
                      instanceId: itemController?.getItemInstanceId(),
                      functionData: data.functionData,
                      linkAlias: data.linkAlias,
                      linkUrl: data.linkUrl,
                      mediaType: data.mediaType,
                    };
  
                    SceneManager.Item?.doItemFunction(doData);
                    setItemFunctionData(doData);
                  }
                });
              }
            },
          );
        }
      });
    }
  },[sceneStatus, itemId, itemInstanceId]);

  useEffect(() => {
    // 임시로 작업 룸 최적화시 이것도 변경
    SceneManager.Room?.changeRenderLoop(60);
    
    return () => {
      SceneManager.Room?.changeRenderLoop(3);
      //SceneManager.finalize('ITEM');
    };
  }, []);

  // 미리보기에서 canvas가 유지된채로 itemid만 변경할때 사용됨. (room 쪽에서는 사용하면 안됨. room에서 사용하려면 itemClientId가 필요함.)
  const onChangeItemId = useCallback(() => {
    if (SceneManager.Item) SceneManager.Item.initializeItem(itemId);
  }, [itemId]);

  return {
    sceneStatus,
    itemFunctionType,
    handleCloseModal,
    handleClickSave,
    handleClickReset,
    onAfterInitScene,
    onChangeItemId,
  };
};

export default useItemFullScreenModal;
