import useBalloonsAPI from '@/apis/Social/Balloons';
import {
  BALLOON_OPERATION_TYPE,
  PatchBalloonsResponse,
} from '@/apis/Social/Balloons/type';
import usePopup from '@/common/hooks/Popup/usePopup';
import { t } from 'i18next';
import {
  currentMyRoomIdAtom,
  needRefetchRoomBalloonsAtom,
} from '@/common/stores';
import { useAtomValue, useSetAtom } from 'jotai';
import { getLocaleText, parseTagString } from '@/common/utils/text';
import useRoom from '@/common/hooks/use-room';

const useBalloonsPatch = () => {
  const { currentRoomInfo } = useRoom();
  const { showConfirmPopup } = usePopup();
  const { mutationPatchBalloons, clearFetchBalloonsKey } = useBalloonsAPI();
  const setNeedRefetchRoomBalloons = useSetAtom(needRefetchRoomBalloonsAtom);
  const isOwnRoom = currentRoomInfo?.mine;
  const currentRoomProfileId = currentRoomInfo?.ownerId;
  const targetRoomProfileId = isOwnRoom ? 'me' : currentRoomProfileId;
  const targetRoomId = useAtomValue(currentMyRoomIdAtom);

  const clearCurrentRoomBalloonsKey = () => {
    clearFetchBalloonsKey(targetRoomProfileId!, targetRoomId, 'myroom');
    clearFetchBalloonsKey(targetRoomProfileId!, targetRoomId, 'active');
    clearFetchBalloonsKey(targetRoomProfileId!, targetRoomId, 'inactive');
  };
  const patchBalloonsState = (
    myroom_id: string,
    balloonIds: string[],
    operation: BALLOON_OPERATION_TYPE,
    checkConfirm: boolean = true,
    callback?: (res: PatchBalloonsResponse | null) => void,
  ) => {
    let contentText: string | JSX.Element | JSX.Element[] = '';
    let confirmText: string | JSX.Element | JSX.Element[] = '';
    const targetBalloonNum = balloonIds.length;
    if (checkConfirm) {
      switch (operation) {
        case 'activate':
          contentText = parseTagString(
            `${t('GMY.000166', { 0: targetBalloonNum })}<br/>${t(
              'GMY.000167',
            )}`,
          );
          confirmText = getLocaleText('GMY.000162');
          break;
        case 'inactivate':
          contentText = parseTagString(
            `${t('GMY.000164', { 0: targetBalloonNum })}<br/>${t(
              'GMY.000165',
            )}`,
          );
          confirmText = getLocaleText('GMY.000163');
          break;
        case 'delete':
          if (targetBalloonNum > 1) {
            contentText = parseTagString(
              `${t('GMY.000054', { 0: targetBalloonNum })}<br/>${t(
                'GMY.000055',
              )}<br/>${t('GMY.000161')}`,
            );
          } else {
            contentText = getLocaleText('GMY.000059', { 0: targetBalloonNum });
          }
          confirmText = getLocaleText('GCM.000042');
          break;
      }
    }

    if (contentText !== '') {
      showConfirmPopup({
        contentText: contentText,
        confirmText: confirmText,
        cancelText: getLocaleText('GCM.000026'),
        onConfirm: () => {
          patchBalloonsStateBody(myroom_id, balloonIds, operation).then(
            (res) => {
              callback?.(res);
            },
          );
        },
      });
    } else {
      patchBalloonsStateBody(myroom_id, balloonIds, operation).then((res) => {
        callback?.(res);
      });
    }
  };
  const patchBalloonsStateBody = async (
    myroom_id: string,
    balloonIds: string[],
    operation: BALLOON_OPERATION_TYPE,
  ) => {
    const res = await mutationPatchBalloons.mutateAsync({
      data: { myroom_id: myroom_id, operation: operation, targets: balloonIds },
    });
    if (!res || res.error) {
      console.log('error : ', res);
    }
    setNeedRefetchRoomBalloons(true);
    clearCurrentRoomBalloonsKey();
    return res;
  };
  return { patchBalloonsState, clearCurrentRoomBalloonsKey };
};
export default useBalloonsPatch;
