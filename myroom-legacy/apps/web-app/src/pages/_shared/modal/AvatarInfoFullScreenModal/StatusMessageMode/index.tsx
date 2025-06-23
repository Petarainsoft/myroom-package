
import React, { useEffect } from 'react';
import ActionBottom from './ActionBottom';
import Message from './Message';
import { SceneManager } from '@/common/utils/client';
import { ECameraMode } from 'client-core/assetSystem/controllers/cameraController';

type StatusMessageModeProps = {
  avatarId: string;
}
const StatusMessageMode = ({ avatarId } : StatusMessageModeProps) => {
  
  // React.useEffect(() => { 
  //   SceneManager.Avatar?.playAnimation(DEFAULT_ACTION_ID, "_01");

  //   return () => { 
  //     SceneManager.Avatar?.setDefaultAvatarCamera();
  //   }
  // }, []);
  
  
  useEffect(() => {
    SceneManager.Avatar?.setCameraMode(ECameraMode.EditStatusMessage); 
  }, []);
  
  return (
    <React.Fragment>
      <Message avatarId={avatarId} />
      <ActionBottom  />
    </React.Fragment>
  );
};

export default StatusMessageMode;
