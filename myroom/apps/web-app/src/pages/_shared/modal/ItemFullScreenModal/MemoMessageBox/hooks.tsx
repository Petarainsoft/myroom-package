import { useAtom, useAtomValue } from 'jotai';
import { isOpenLinkPreviewAtom, itemFunctionDataAtom } from '../store';
import { useCallback, useEffect, useState } from 'react';
import useItemMemoAPI from '@/apis/Social/ItemMemo';
import usePopup from '@/common/hooks/Popup/usePopup';
import Text from '@/components/Text';
import useRoom from '@/common/hooks/use-room';
import useMe from '@/common/hooks/use-me';

const useMessageBox = (itemInstanceId: string) => {
  const { meRoomId } = useMe();
  const { fetchItemMemos, mutationPatchItemMemo } = useItemMemoAPI();
  const { currentRoomInfo } = useRoom();
  const itemFunctionData = useAtomValue(itemFunctionDataAtom);
  const [, setIsOpenLinkPreview] = useAtom(isOpenLinkPreviewAtom);
  const [memoTextViewMode, setMemoTextViewMode] = useState('');
  const { showConfirmPopup } = usePopup();
  const { data: MemoData } = fetchItemMemos({
    profile_id: meRoomId === currentRoomInfo?.id? 'me' : currentRoomInfo?.ownerId,
    myroom_id: currentRoomInfo?.id,
    item_instance_id: itemInstanceId,
  });

  const handleOpenLink = () => {
    return () => window.open(itemFunctionData?.linkUrl, '_blank');
  };

  const handleOpenUrlPreview = () => {
    return () => setIsOpenLinkPreview(true);
  };

  const onClickUrl = {
    ['SETTING']: handleOpenLink(),
    ['VIEW']: handleOpenUrlPreview(),
  };

  const handleDeleteMemo = useCallback(() => {
    mutationPatchItemMemo.mutateAsync({
      params: {
        myroom_id: currentRoomInfo?.id,
        item_instance_id: itemInstanceId,
      },
    });
  }, [mutationPatchItemMemo, currentRoomInfo, itemInstanceId]);

  const showDeletePopup = useCallback(() => {
    showConfirmPopup({
      titleText: (
        <Text
          locale={{ textId: 'GMY.000146' }}
          defaultValue="메모를 삭제하시겠습니까?"
        />
      ),
      onConfirm: handleDeleteMemo,
      confirmText: (
        <Text locale={{ textId: 'GCM.000025' }} defaultValue="삭제" />
      ),
    });
  }, [showConfirmPopup, handleDeleteMemo]);

  useEffect(() => {
    if (MemoData && MemoData.list && MemoData.list.length > 0) {
      setMemoTextViewMode(MemoData.list[0].txt.contents);
    } else {
      setMemoTextViewMode('');
    }
  }, [MemoData]);

  return {
    itemFunctionData,
    onClickUrl,
    showDeletePopup,
    memoText: memoTextViewMode,
  };
};

export default useMessageBox;
