import { useCallback, useState } from "react";
import { SceneStatus } from "./type";
import { Scene } from "@babylonjs/core/scene";
import { SceneManager, SceneType } from "@/common/utils/client";



const useScene = () => {
    const [sceneStatus, setSceneStatus] = useState<SceneStatus>('UNINITIALIZED');

    return {sceneStatus, setSceneStatus};
}

export default useScene;