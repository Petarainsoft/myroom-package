import { MyRoomAPI } from 'client-core';
import { Scene } from "@babylonjs/core/scene";
type TInitCallback = () => void;

export abstract class SceneManagerTemplate {
  protected static _myRoomAPI: MyRoomAPI | null = null;
  protected static _onInitCallback: TInitCallback[] = [];
  protected static _scene: Scene | null = null;
}

/** 
  현재 myroom client 코드를 보면, MyRoomAPI를 사용할때 다음과 같이 사용해야 합니다.
  avatar용으로 사용시 다 쓰고 나서,
  MyRoom.clearAvatar()
  MyRoom.finalize()
  item용으로 사용시 다 쓰고 나서,
  MyRoom.clearItem()
  MyRoom.finalize()
  room용으로 사용시 다 쓰고 나서,
  MyRoom.clearRoom()
  MyRoom.finalize()
  -> 더해서 onSceneRender 안에서 scene.dispose() 필요
*/

