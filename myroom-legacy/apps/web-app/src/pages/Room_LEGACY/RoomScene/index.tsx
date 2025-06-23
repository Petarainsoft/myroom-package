import { useAtomValue } from 'jotai';
import { myRoomBgColorAtom } from '@/common/stores';
import SceneComponent from 'babylonjs-hook';
import { SceneManager } from '@/common/utils/client';
import { Scene } from '@babylonjs/core';
import { logger } from '@/common/utils/logger';
import { ConstantsEx } from 'client-core';
import BalloonLayer from './BalloonLayer';
import style from './style.module.scss';

const RoomScene = () => {
  const myRoomBgColor = useAtomValue(myRoomBgColorAtom);

  const onSceneReady = async (scene: Scene) => {
    logger.log('room onSceneReady ');
    ConstantsEx.setScreenScale(scene);
    SceneManager.initializeScene({
      scene, 
      type: 'ROOM', 
      onSuccess: () => {}
    });
  };

  return (
    <div
      className={style['roomSceneWrap']}
      style={{ backgroundColor: myRoomBgColor }}
    >
      <SceneComponent
        antialias={ConstantsEx.getAntialias()}
        engineOptions={ConstantsEx.getEngineOption()}
        adaptToDeviceRatio={ConstantsEx.getAdaptToDeviceRatio()}
        onSceneReady={onSceneReady}
        id={ConstantsEx.CANVAS_ID}
        className={style['roomScene']}
      />

      {/* <BalloonLayer /> */}
      {/*<div id="fps">0</div>*/}
    </div>
  );
};

export default RoomScene;
