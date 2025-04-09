import { useMemo, useCallback, useState } from 'react';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import { EMyRoomMode } from 'client-core';
import { SceneManager } from '@/common/utils/client';
import useMe from '@/common/hooks/use-me';
import usePopup from '@/common/hooks/Popup/usePopup';
import useThumbnail from '@/common/hooks/use-thumbnail';
import { selectionCallback } from '@/pages/Room_LEGACY/callbackHelper';
import { ISelectButton } from '@/pages/_shared/offcanvas/SelectOffCanvas';
import { t } from 'i18next';

const useCoordi = () => {
  const { meRoomId } = useMe();
  const { showConfirmPopup, showToastPopup } = usePopup();
  const {
    fetchMyroomTemplates,
    mutationPostMyroomTemplate,
    mutationDelMyroomTemplate,
    mutationFetchMyroomTemplate,
  } = useMyRoomAPI();
  const [selectedId, setSelectedId] = useState<string>();
  const { createThumbnail  } = useThumbnail();

  const { data: coordiListData } = fetchMyroomTemplates(
    meRoomId ? meRoomId : undefined,
  );

  const coordiCount = useMemo(() => {
    return coordiListData?.list ? coordiListData?.list.length : 0;
  }, [coordiListData]);

  const handleClickAddCoordi = useCallback(() => {
    if (!meRoomId) {
      return;
    }

    //- 코디 슬롯 체크
    if (coordiCount >= 5) {
      showToastPopup({ titleText: t('GMY.000087') });
      return;
    }

    SceneManager.Room?.makeMyRoomManifest((manifest) => {
      SceneManager.Room?.clearMyRoom();

      if (manifest) {
        SceneManager.Room?.initializeMyRoom(manifest, true, () => {
          SceneManager.Room?.makeMyRoomManifest((coordiManifest) => {

            createThumbnail(SceneManager.Room, async (id) => { 
              await mutationPostMyroomTemplate.mutateAsync({
                id: meRoomId,
                data: {
                  resource: { thumbnail: id },
                  manifest: coordiManifest
                },
              });

              SceneManager.Room?.clearMyRoom();
              SceneManager.Room?.initializeMyRoom(manifest, false, () => {
                SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
                  selectionCallback,
                );
                SceneManager.Room?.getMyRoomMode((mode) => {
                  SceneManager.Room?.startMyRoomPlacementMode();
                });
              });

            })
          });
        });
      }
    });
  }, [meRoomId, coordiCount, showToastPopup, createThumbnail, mutationPostMyroomTemplate]);

  const handleClickChangeCoordi = useCallback(async () => {
    if (meRoomId && selectedId) {
      const manifest = await mutationFetchMyroomTemplate.mutateAsync({
        id: meRoomId,
        templateId: selectedId,
      });
      SceneManager.Room?.getMyRoomMode((mode) => {
        if (mode === EMyRoomMode.Placement) {
          SceneManager.Room?.endMyRoomPlacementMode();
        }
        SceneManager.Room?.clearMyRoom();
        SceneManager.Room?.initializeMyRoom(manifest, false, () => {
          SceneManager.Room?.addCallbackRoomPlacementSelectionChanged(
            selectionCallback,
          );
          SceneManager.Room?.getMyRoomMode((mode) => {
            if (mode !== EMyRoomMode.Placement) {
              SceneManager.Room?.startMyRoomPlacementMode();
            }
          });
        });
      });

      setSelectedId(undefined);
    }
  }, [meRoomId, selectedId]);

  const handleClickRemove = async () => {
    if (!meRoomId) return;

    if (selectedId) {
      await mutationDelMyroomTemplate.mutateAsync({
        id: meRoomId,
        templateId: selectedId,
      });

      setSelectedId(undefined);
    }
  };

  const handleClickRemoveConfirm = useCallback(async () => {
    showConfirmPopup({
      titleText: t('GMY.000086'),
      onConfirm: handleClickRemove,
    });
  }, [handleClickRemove]);

  const handleClickCoordi = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const actions = useMemo(() => {
    const actions: ISelectButton[] = [
      {
        textId: 'GMY.000081',
        onClick: handleClickChangeCoordi,
      },
      { 
        textId: 'GMY.000082',
        onClick: handleClickRemoveConfirm,
      },
    ];

    return actions;
  }, [handleClickChangeCoordi, handleClickRemoveConfirm]);

  const handleClickCancel = useCallback(() => {
    setSelectedId(undefined);
  }, []);

  return {
    coordiCount,
    coordiListData,
    actions,
    selectedId,
    handleClickAddCoordi,
    handleClickRemoveConfirm,
    handleClickCoordi,
    handleClickCancel,
  };
};

export default useCoordi;
