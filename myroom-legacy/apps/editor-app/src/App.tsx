import { Engine, WebGPUEngine } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene'
import { ConstantsEx } from 'client-core';
import React, { useCallback, useMemo, useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import 'the-new-css-reset/css/reset.css';
import styles from './styles.module.scss';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


import myRoom from './scenes/myRoom';
import artStudio from './scenes/artStudio';
import itemViewer from './scenes/itemViewer';
import SceneFacialExpression from './scenes/sceneFacialExpression';

import './App.scss';


interface CreateSceneClass {
    createScene: (engine: Engine, canvas: HTMLCanvasElement) => Promise<Scene>
    preTasks?: Promise<unknown>[]
}


const App = () => {
  const [sceneName, setSceneName] = useState('myRoom');

  const sceneList = useMemo(() => {
    return [
      {
        name: "myRoom",
        component: myRoom,
      },
      {
        name: "artStudio",
        component: artStudio,
      },
      {
        name: "facialExpression",
        component: SceneFacialExpression,
      },
      {
        name: "itemViewer",
        component: itemViewer,
      }
    ]
  }, []);

  const getSceneModuleWithName = useCallback((name = 'myRoom'): CreateSceneClass => {
    const scene = sceneList.find(scene => scene.name === name)
    return scene ? scene.component : myRoom
  }, [sceneList]);


  const initScene = useCallback(async (sceneName: string) => {
    const canvas = document.getElementById(ConstantsEx.CANVAS_ID) as HTMLCanvasElement;
    if (!canvas) {
      console.warn("babylonInit:no renderCanvas");
      return;
    }
    // canvas.style.backgroundColor = 'blue';
    const canvasContainer = document.getElementById("renderCanvasContainer") as HTMLCanvasElement;
    if (!canvasContainer) {
      console.warn("babylonInit:no renderCanvasContainer");
      return;
    }
    canvasContainer.style.backgroundColor = '#5faed9';

    // get the module to load
    //const moduleName = getModuleToLoad();
    const createSceneModule = await getSceneModuleWithName(sceneName);
    const engineType =
      location.search.split("engine=")[1]?.split("&")[0] || "webgl";
    // Execute the pretasks, if defined
    await Promise.all(createSceneModule.preTasks || []);

    // Generate the BABYLON 3D engine
    let engine: Engine | null = null;
    if (engineType === "webgpu") {
      const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
      if (webGPUSupported) {
        const webgpu = engine = new WebGPUEngine(canvas, {
          adaptToDeviceRatio: true,
          antialias: true,
        });
        await webgpu.initAsync();
        engine = webgpu;
      }
    }

    if (!engine) {
      engine = new Engine(canvas, true);
    }

    // Create the scene
    const scene = await createSceneModule.createScene(engine, canvas);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
      scene?.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
      engine?.resize();
    });
  }, [getSceneModuleWithName]);

  React.useEffect(() => {
    initScene(sceneName);
  }, [initScene, sceneName]);

  const handleChangeScene = (e: SelectChangeEvent) => {
    Engine.LastCreatedEngine?.dispose();
    setSceneName(e.target.value);
  };

  return (
   
      <main className={styles["wrap"]}>
        <div id="renderCanvasContainer">
          <canvas
            className={styles['canvas']}
            id={ConstantsEx.CANVAS_ID}
            touch-action="none"
          ></canvas>
        </div>
        <FormControl className={styles['form-wrap']}>
          <InputLabel id="select-helper-label">Scene</InputLabel>
          <Select labelId='select-helper-label' label={'Scene'} onChange={handleChangeScene} value={sceneName} className={styles['select-scene']}>
            <MenuItem  value={'myRoom'}>myRoom</MenuItem>
            <MenuItem  value={'artStudio'}>artStudio</MenuItem>
            <MenuItem  value={'facialExpression'}>scenefacialExpression</MenuItem>
            <MenuItem  value={'itemViewer'}>itemViewer</MenuItem>
          </Select>
        </FormControl>
      </main>

  );
}

export default App
