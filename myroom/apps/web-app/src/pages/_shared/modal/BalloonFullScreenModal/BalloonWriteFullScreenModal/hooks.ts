import useBalloonsAPI from '@/apis/Social/Balloons';
import useMyRoomAPI from '@/apis/Space/MyRoom';
import useProfileAPI from '@/apis/User/Profile';
import useModal from '@/common/hooks/Modal/useModal';
import usePopup from '@/common/hooks/Popup/usePopup';
import {
  createdBalloonDataAtom,
  needRefetchRoomBalloonsAtom,
  selectedBalloonItemDataAtom,
} from '@/common/stores';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChangeEvent, useState } from 'react';
import useBalloonsPatch from '../Hooks/useBalloonsPatch';
import { EPriceType } from 'client-core';
import { getLocaleText } from '@/common/utils/text';
import { getProfileThumbnail } from '@/common/utils/profile';
export const MESSAGE_MAX_LENGTH = 2000;
const useBalloonWriteFullScreenModal = (
  targetRoomId: string,
  onRequestClose: any,
) => {
  const { mutationPostBalloons } = useBalloonsAPI();
  const { clearCurrentRoomBalloonsKey } = useBalloonsPatch();
  const { data: roomData } = useMyRoomAPI().fetchMyroom(targetRoomId);
  const { data: profileData } = useProfileAPI().fetchProfile(
    roomData?.data.profile_id,
  );
  const targetNickname = profileData?.data.option.nick;
  const targetSelfie = getProfileThumbnail(profileData);
  const selectedBalloonItemData = useAtomValue(selectedBalloonItemDataAtom);
  const setCreatedBalloonData = useSetAtom(createdBalloonDataAtom);
  const setNeedRefetchRoomBalloons = useSetAtom(needRefetchRoomBalloonsAtom);
  const BalloonMessageListFullScreenModal = useModal(
    'BalloonMessageListFullScreenModal',
  );
  const BalloonReadFullScreenModal = useModal('BalloonReadFullScreenModal');
  const { showToastPopup, showAlertPopup, showConfirmPopup } = usePopup();
  const [message, setMessage] = useState('');
  const handleChangeCategory = () => {};
  const handleChangeMessage = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.currentTarget.value.length > MESSAGE_MAX_LENGTH) {
      showToastPopup({
        titleText: `풍선 메시지는 ${MESSAGE_MAX_LENGTH}자까지 입력 가능합니다.`,
      });
      e.currentTarget.value = e.currentTarget.value.slice(
        0,
        MESSAGE_MAX_LENGTH,
      );
    }

    setMessage(e.currentTarget.value);
  };

  const handleSendBalloon = () => {
    const priceType = selectedBalloonItemData?.option.price.type;
    const amount = selectedBalloonItemData?.option.price.amount ?? 0;
    if (priceType !== EPriceType.FREE && amount > 0) {
      let contentTextId = '';
      switch (priceType) {
        case EPriceType.SOFTCURRENCY:
          contentTextId = 'GMY.000062';
          break;
        case EPriceType.HARDCURRENCY:
          contentTextId = 'GMY.000040';
          break;
      }
      const contentText = getLocaleText(contentTextId, { 0: amount }, true);

      showConfirmPopup({
        titleText: getLocaleText('GMY.000039'),
        contentText: contentText,
        confirmText: getLocaleText('GCM.000034'),
        onConfirm: sendBalloon,
      });
    } else {
      sendBalloon();
    }
  };
  const sendBalloon = async () => {
    const res = await mutationPostBalloons.mutateAsync({
      data: {
        option: { language: 'ko' },
        balloon_market_product_id: selectedBalloonItemData?._id ?? '',
        myroom_id: targetRoomId,
        txt: { contents: message },
      },
    });
    if (!res || res.error) {
      if (res?.error?.toString() === '27014') {
        showAlertPopup({ titleText: getLocaleText('GMY.000044', null, true) });
      } else {
        const errorDesc = res?.error_desc ? res.error?.toString() : '';
        showAlertPopup({
          titleText: '풍선 날리기에 실패했습니다.',
          contentText: errorDesc,
        });
      }
      console.log('mutationPostBalloons has error.', res);
    } else {
      setCreatedBalloonData(res.data);
      setNeedRefetchRoomBalloons(true);
      if (BalloonMessageListFullScreenModal.isOpen) {
        BalloonMessageListFullScreenModal.deleteModal();
      }
      // clearFetchBalloonsKey(
      //   targetRoomProfileId,
      //   targetRoomId,
      //   'myroom',
      // );
      // clearFetchBalloonsKey(
      //   targetRoomProfileId,
      //   targetRoomId,
      //   'active',
      // );
      clearCurrentRoomBalloonsKey();
      closeAllBalloonModal();
    }
  };
  const closeAllBalloonModal = () => {
    if (BalloonReadFullScreenModal.isOpen)
      BalloonReadFullScreenModal.deleteModal();
    if (BalloonMessageListFullScreenModal.isOpen)
      BalloonMessageListFullScreenModal.deleteModal();
    onRequestClose();
  };
  return {
    targetNickname,
    targetSelfie,
    message,
    handleChangeCategory,
    handleChangeMessage,
    handleSendBalloon,
  };
};
export default useBalloonWriteFullScreenModal;
