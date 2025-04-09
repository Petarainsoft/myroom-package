import useStatusMessageAPI from '@/apis/Social/StatusMessage';
import usePopup from '@/common/hooks/Popup/usePopup';
import {
  EditedStatusImageAtom,
  EditedStatusMessageInputAtom,
  isClosedStatusMessageModalAtom,
  editedStatusActionIdAtom,
  reqAvatarIdAtom,
  uiAvatarStatusMessageAtom,
  statusActionIdAtom,
} from '@/common/stores';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Text from '@/components/Text';
import useResourceAPI from '@/apis/Resource';
import useCoordiAPI from '@/apis/Space/Avatar';
import { AvatarManager } from '@/common/factories/avatar';
import { DEFAULT_ACTION_ID } from '@/common/constants/avatar';
import useThumbnail from '@/common/hooks/use-thumbnail';
import { SceneManager } from '@/common/utils/client';

const useStatusMessage = () => {
  const { showConfirmPopup } = usePopup();
  const { mutationPostStatusMessage } = useStatusMessageAPI();
  const { mutationPostResourceImage } = useResourceAPI();
  const { showToastPopup } = usePopup();
  const editedStatusImage = useAtomValue(EditedStatusImageAtom);
  const setEditedStatusImage = useSetAtom(EditedStatusImageAtom);
  const [, setIsClosed] = useAtom(isClosedStatusMessageModalAtom);
  const [editedStatusMessageInput, setEditedStatusMessageInput] = useAtom(
    EditedStatusMessageInputAtom,
  );
  const [, setUiStatusMessage] = useAtom(uiAvatarStatusMessageAtom);
  const [editedStatusActionId, setEditedStatusActionId] = useAtom(
    editedStatusActionIdAtom,
  );
  const { createThumbnail } = useThumbnail();

  const [statusActionId, setStatusActionId] = useAtom(statusActionIdAtom);
  const { mutationPatchAvatar } = useCoordiAPI();
  
  //상태메시지 저장
  //초기 서버 데이터에 저장된 정보와 Atom에 저장된 정보가 다른지 체크
  const useExitStatusMessageEditor = () => {
    if (
      editedStatusActionId == statusActionId &&
      !editedStatusImage &&
      !editedStatusMessageInput
    ) {
      setUiStatusMessage(false);
      setEditedStatusActionId(null);
      setStatusActionId(null);
      //애니메이션 원복
      AvatarManager.getAPI.playAnimation(statusActionId!, '_02');
      return;
    }
    showConfirmPopup({
      titleText: (
        <Text
          locale={{ textId: 'GCM.000016' }}
          defaultValue="이 페이지에서 나가시겠습니까?"
        />
      ),
      contentText: (
        <Text
          locale={{ textId: 'GCM.000017' }}
          defaultValue="나가면 편집한 내용이 저장되지 않고 사라집니다."
        />
      ),
      onConfirm: () => {
        setUiStatusMessage(false);
        setEditedStatusActionId(null);
        setStatusActionId(null);
        AvatarManager.getAPI.playAnimation(statusActionId!, '_02');
      },
      confirmText: (
        <Text locale={{ textId: 'GCM.000018' }} defaultValue="나가기" />
      ),
      cancelText: (
        <Text locale={{ textId: 'GCM.000019' }} defaultValue="머무르기" />
      ),
    });
  };

  const postStatusMessageImage = async (images: File): Promise<string> => {
    const res = await mutationPostResourceImage.mutateAsync({
      params: {},
      data: { images },
    });
    return res.list[0]._id;
  };

  const showSuccessToast = () => {
    showToastPopup({
      titleText: (
        <Text
          locale={{ textId: 'GMY.000014' }}
          defaultValue="상태피드에 게시되었습니다"
        />
      ),
    });
  };

  const useSaveStatusMessageEditor = async (reqAvatarId:string) => {
    SceneManager.Avatar?.makeAvatarManifest(async (manifest) => {
       //이미지 변경사항 있을 때
      if (editedStatusImage) {
        const newCopiedStatusImageId = await postStatusMessageImage(
          editedStatusImage?.file,
      );

      // SceneManager.Avatar?.playAnimation(
      //   editedStatusActionId ?? DEFAULT_ACTION_ID,
      //   '_01',
      // );
      createThumbnail(SceneManager.Avatar, async (id: string) => {
        await mutationPostStatusMessage.mutateAsync({
          data: {
            option: {
              comments_enable: true,
              comments_input_scope: 'all',
              fixed: false,
              language: 'ko',
              show: true,
            },
            resource: {
              action: [manifest?.main.animation ?? DEFAULT_ACTION_ID],
              image: [id, newCopiedStatusImageId],
            },
            txt: {
              contents: '',
              hashtag: [],
              title: null,
            },
          },
        });
      });
      //변경사항 삭제
      setEditedStatusMessageInput('');
      setEditedStatusImage(null);
      showSuccessToast();
      return;
    } else {
      //그 외
      // SceneManager.Avatar?.playAnimation(
      //   editedStatusActionId ?? DEFAULT_ACTION_ID,
      //   '_01',
      // );
      createThumbnail(SceneManager.Avatar, async (id: string) => {
          await mutationPostStatusMessage.mutateAsync({
            data: {
              option: {
                comments_enable: true,
                comments_input_scope: 'all',
                fixed: false,
                language: 'ko',
                show: true,
              },
              resource: {
                action: [   manifest?.main.animation ?? DEFAULT_ACTION_ID],
                image: [id],
              },
              txt: {
                contents: editedStatusMessageInput ?? '',
                hashtag: [],
                title: null,
              },
            },
          });
        });
        showSuccessToast();
        setEditedStatusMessageInput('');
        setEditedStatusImage(null);
      }
      if (manifest) {
        await mutationPatchAvatar.mutateAsync({
          id: reqAvatarId,
          data: { manifest: manifest as any },
        });

        // 룸 아바타 갱신.
        SceneManager.Room?.refreshFigureModels([reqAvatarId]);
      }

    });
  };

  // const handleAvatarManifestSave = (res: any) => {
  //   if (res?.data) {
  //     const callback = async (manifest: any) => {
  //       console.log('ACTIONTEST ReqAvatarManifest callback ', manifest);
  //       if (!manifest) return;
      
  //       console.log('ReqAvatarManifest res ', res);
  //     };
  //     SceneManager.Avatar?.makeAvatarManifest(callback);
  //   }
  // };

  
  return {
    useExitStatusMessageEditor,
    useSaveStatusMessageEditor,
    setIsClosed,
  };
};

export default useStatusMessage;
