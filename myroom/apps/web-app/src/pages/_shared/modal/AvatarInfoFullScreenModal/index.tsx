import { Modal, ModalProps } from '@/components/_core/ModalCore';
import useAvatarInfoFullScreenModal, { AvatarInfoStatus } from './hooks';
import styles from './styles.module.scss';
import CanvasScene from '@/pages/_shared/ui/CanvasScene';
import Switcher, { SwitchCompnents } from '../../layouts/Switcher';
import View from '../../layouts/View';
import { useCallback, useMemo } from 'react';
import CustomMode from './CustomMode';
import MainMode from './MainMode';
import StatusMessageMode from './StatusMessageMode';
import SavePurchaseButton from '../../ui/Buttons/SavePurchaseButton';
import RoomProfile from '../../ui/Profiles/RoomProfile';
import { FaceWebCam } from '@/common/faceWebCam';

interface IAvatarInfoFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  avatarId: string;
  itemId?: string;
}

const AvatarInfoFullScreenModal = ({
  avatarId,
  itemId,
}: IAvatarInfoFullScreenModal) => {
  const {
    sceneStatus,
    profileId,
    avatarInfoStatus,
    handleClickClose,
    onAfterSceneReady,
    handleClickCustomSave,
    handleClickStatusMesaageSave,
  } = useAvatarInfoFullScreenModal(avatarId, itemId);

  const modes = useMemo((): SwitchCompnents<AvatarInfoStatus> => {
    return [
      {
        status: 'MAIN',
        element: <MainMode avatarId={avatarId} profileId={profileId} />,
      },
      {
        status: 'CUSTOM',
        element: (
          <CustomMode
            profileId={profileId}
            avatarId={avatarId}
            itemId={itemId}
          />
        ),
      },
      { status: 'EDIT_STATUS', element: <StatusMessageMode avatarId={avatarId} /> },
    ];
  }, [profileId, avatarId, itemId]);

  const HeaderAction = useCallback(() => {
    if (avatarInfoStatus !== 'MAIN') {
      return (
        <SavePurchaseButton
          onSave={
            avatarInfoStatus === 'CUSTOM'
              ? handleClickCustomSave
              : handleClickStatusMesaageSave
          }
          id={
            avatarInfoStatus === 'CUSTOM'
              ? 'ga-avatar-custom-save'
              : 'ga-status-message-create'
          }
        />
      );
    }

    return null;
  }, [avatarInfoStatus, handleClickCustomSave, handleClickStatusMesaageSave]);

  return (
    <Modal isOpen={true} className={styles['wrap']}>
      <View
        disableNavigation
        className={styles['container']}
        headerOptions={{
          float: true,
          closeOptions: {
            onClick: handleClickClose,
            icon: avatarInfoStatus === 'EDIT_STATUS' ? 'arrow' : 'x',
          },
          startArea: avatarInfoStatus === 'MAIN' && <RoomProfile/>,
          endArea: <HeaderAction />,
        }}
      >
        <CanvasScene className={styles['scene-container']} onAfterSceneReady={onAfterSceneReady} type={'AVATAR'} />
        {sceneStatus === 'LOADED' && <Switcher status={avatarInfoStatus} elements={modes} />}
        {/* <FaceWebCam className={styles.webcam} /> */}
      </View>
    </Modal>
  );
};

export default AvatarInfoFullScreenModal;
