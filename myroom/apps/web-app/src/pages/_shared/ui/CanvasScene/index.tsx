import React from 'react';
import SceneComponent from 'babylonjs-hook';
import { Scene } from '@babylonjs/core';
import { ConstantsEx } from 'client-core';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { SceneManager, SceneType } from '@/common/utils/client';


type CanvasSceneProps = {
  className?: string;
  type:SceneType;
  backgroundColor?:string;
  onAfterSceneReady?: () => void;
}

const CanvasScene = ({ className, type, backgroundColor, onAfterSceneReady}: CanvasSceneProps) => {

  React.useEffect(() => {
    return () => {
      if(SceneManager.isInit(type))
        SceneManager.finalize(type);
    }
  }, []);

  const onSceneReady = React.useCallback(async (scene: Scene) => {
    ConstantsEx.setScreenScale(scene);
    SceneManager.initializeScene({
      scene, 
      type,
      onSuccess: onAfterSceneReady
  });
  }, [onAfterSceneReady]);

  //RoomManager.useOptimizeRenderRoom();

  return <React.Fragment>
    <SceneComponent
      className={classNames(styles['scene'], className)}
      antialias={ConstantsEx.getAntialias()}
      engineOptions={ConstantsEx.getEngineOption()}
      adaptToDeviceRatio={ConstantsEx.getAdaptToDeviceRatio()}
      onSceneReady={onSceneReady}
      style={{backgroundColor}}
    />
  </React.Fragment>
};

export default CanvasScene;
