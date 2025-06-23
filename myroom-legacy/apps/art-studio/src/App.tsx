import React from 'react';
import './App.scss';
import ModelScene from './components/ModelScene';
import FixedView from './components/FixedView';
import { ipcRenderer } from 'electron';
import LogWindow, {registerIpcChannelEventListener_LogWindow} from './components/LogWindow';
import { Logger } from './core/front/logger';
import ItemExplorerComponent from './components/ItemExplorer/itemExplorerComponent';
import { useAtom } from 'jotai';
import { itemExplorerDataAtom, globalStateAtom } from './core/front/stores';
import { EditorApp } from './core/front/editorApp';
import PropertyGrid from './components/PropertyGrid';
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';
import { EditorMode_ItemEditor } from './core/front/editorMode/editorMode_MaterialEditor';
import { EEditorMode, stringToEditorMode } from './core/front/editorMode/editorModeBase';
import { EditorConstants } from './core/constant';
import EquipProperty from './components/EquipProperty';

const Thema = {
  colors: {
    primary: '#DBFC3D',
    secondary: '#FF2164',
    tertiary: '#63FFF6 ',
    fail: '#FF4A4D',
    defaultBackground: '#FFFFFF',
    fonts: [
      '#FFFFFF',
      '#F9F9F9',
      '#EEEEEE',
      '#BBBBBB',
      '#999999',
      '#666666',
      '#000000',
    ],
  },
};


const checkBrowserSize = ($rootStyle:CSSStyleDeclaration) => {
  if(!$rootStyle){
    return;
  }
  let heightPerOne = window.innerHeight * 0.01;
  $rootStyle.setProperty('--vh', `${heightPerOne}px`);
}
const handleResize = ()=>{
  checkBrowserSize(document.documentElement.style);
}
const handleOrientationChange = (event:any)=>{
  checkBrowserSize(document.documentElement.style);
}

function App() {
  const [globalState,setGlobalState] = useAtom(globalStateAtom);
  const [itemExplorerData,setItemExploreData] = useAtom(itemExplorerDataAtom);
  const [pointerInfo, setPointerInfo] = React.useState({startX:0,moveInProgress:false,_moveInProgress:false,leftWidth:300,rightWidth:350});
  const [lockObject] = React.useState(new LockObject());

  globalState.onForceRefreshUIObservable.add(()=>{
    console.log("onForceRefreshUIObservable");
    EditorApp.getInstance().executeCommand(EditorMode_ItemEditor.EDITOR_COMMAND_REFRESH_UI);
  });
  //-------------------------------------------------------------------------------------
  // Layout 관련 (좌우 사이즈 조절)
  //-------------------------------------------------------------------------------------
  const onPointerDown = (evt: React.PointerEvent<HTMLDivElement>) => {
    setPointerInfo(preState =>({...preState, startX:evt.clientX,moveInProgress:true}));
    evt.currentTarget.setPointerCapture(evt.pointerId);
  }

  const onPointerUp = (evt: React.PointerEvent<HTMLDivElement>) => {
    setPointerInfo(preState =>( {...preState,moveInProgress:false}));
    evt.currentTarget.releasePointerCapture(evt.pointerId);
  }

  const resizeColumns = (evt: React.PointerEvent<HTMLDivElement>, mode:EEditorMode, forLeft = true) => {
    if (!pointerInfo.moveInProgress) {
        return;
    }

    const deltaX = evt.clientX - pointerInfo.startX;
    const rootElement = evt.currentTarget.ownerDocument!.getElementById("editor") as HTMLDivElement;

    if (forLeft) {
      let leftWidth = pointerInfo.leftWidth + deltaX;
      leftWidth = Math.max(150, Math.min(400, leftWidth));
      setPointerInfo(preState =>({...preState,leftWidth}));
    }else {
      let rightWidth = pointerInfo.rightWidth - deltaX;
      rightWidth = Math.max(250, Math.min(500, rightWidth));
      setPointerInfo(preState =>({...preState,rightWidth}));
    }

    rootElement.style.gridTemplateColumns = buildGridTemplateColumns(mode);
    setPointerInfo(preState =>({...preState,startX:evt.clientX}));
  }

  const buildGridTemplateColumns = (mode:EEditorMode)=>{
    if(mode === EEditorMode.MaterialEditor){
      return `${pointerInfo.leftWidth}px 4px calc(100% - ${pointerInfo.leftWidth + 8 + pointerInfo.rightWidth}px) 4px ${pointerInfo.rightWidth}px`;
    }
    else if(mode === EEditorMode.EquipEditor){
      return `calc(100% - ${4 + pointerInfo.rightWidth}px) 4px ${pointerInfo.rightWidth}px`;
    }

    return `calc(100%)`;
  }

  //-------------------------------------------------------------------------------------
  // ui 변경 관련
  //-------------------------------------------------------------------------------------
  const updateUI = () =>{
    if(EditorApp.getInstance()){
      const uiController = EditorApp.getInstance().getUIController();
      if(uiController && uiController.getItemExplorerDataChanged()){
        setItemExploreData(uiController.getItemExplorerData());
      }
    }
  }

  //-------------------------------------------------------------------------------------
  // 이벤트 핸들러 등록
  //-------------------------------------------------------------------------------------
  React.useEffect(() => {
    const interval = setInterval(() => {
      updateUI();
    }, 300);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    registerIpcChannelEventListener_LogWindow(ipcRenderer);
  }, []);

  React.useEffect(() => {
    ipcRenderer.on(EditorConstants.IPC_CHANNEL_SET_EDITOR_MODE, (event, mode) => {
      const m:EEditorMode = stringToEditorMode(mode);
      setGlobalState(preState => ({...preState,editorMode:m}));
    });
  },[globalState]);


  //-------------------------------------------------------------------------------------
  // 모드별 Render
  //-------------------------------------------------------------------------------------
  const renderMode=(mode:EEditorMode)=>{
    if(mode === EEditorMode.MaterialEditor){
      return renderEditorMode();
    }
    else if(mode === EEditorMode.EquipEditor){
      return renderEquipEditorMode();
    }
    else if(mode === EEditorMode.ItemViewer){
      return renderViewerMode();
    }

    mode !== EEditorMode.None ?? console.error("renderMode() : Not handled mode " + mode );
    return renderNoneMode();
  }

  const renderEditorMode = () =>{
    return (
      <div
        id="editorMode"
        style={{
          gridTemplateColumns :buildGridTemplateColumns(globalState.editorMode)
        }}
      >
        {/* 트리뷰 */}
        <div className = "left-panel">
          <ItemExplorerComponent globalState={globalState} data={itemExplorerData}/>
        </div>

        {/* 사이즈 조절 핸들 */}
        <div
            id="left-grab"
            onPointerDown={(evt) => onPointerDown(evt)}
            onPointerUp={(evt) => onPointerUp(evt)}
            onPointerMove={(evt) => resizeColumns(evt,globalState.editorMode)}
        ></div>

        {/* 씬뷰 */}
        <div id = "scene">
          <ModelScene canvasId='my-canvas' globalState={globalState}/>
        </div>

        {/* 사이즈 조절 핸들 */}
        <div
            id="right-grab"
            onPointerDown={(evt) => onPointerDown(evt)}
            onPointerUp={(evt) => onPointerUp(evt)}
            onPointerMove={(evt) => resizeColumns(evt, globalState.editorMode,false)}
        ></div>

        {/* 프로퍼티 탭 */}.
        <div className = "right-panel">
          {<PropertyGrid lockObject={lockObject} globalState={globalState}/>}
        </div>

        {/* 로그 윈도우 */}
        <div id = "log">
          <LogWindow />
        </div>
      </div>
    );
  }

  const renderViewerMode = () =>{
    return (
      <div
        id="viewerMode"
        style={{
          gridTemplateColumns :buildGridTemplateColumns(globalState.editorMode)
        }}
      >
        {/* 씬뷰 */}
        <div id = "scene">
          <ModelScene canvasId='my-canvas' globalState={globalState}/>
        </div>

        {/* 로그 윈도우 */}
        <div id = "log">
          <LogWindow />
        </div>
      </div>
    );
  }

  const renderEquipEditorMode = () =>{
    return (
      <div
        id="equipEditorMode"
        style={{
          gridTemplateColumns :buildGridTemplateColumns(globalState.editorMode)
        }}
      >
        {/* 씬뷰 */}
        <div id = "scene">
          <ModelScene canvasId='my-canvas' globalState={globalState}/>
        </div>

        {/* 사이즈 조절 핸들 */}
        <div
            id="right-grab"
            onPointerDown={(evt) => onPointerDown(evt)}
            onPointerUp={(evt) => onPointerUp(evt)}
            onPointerMove={(evt) => resizeColumns(evt, globalState.editorMode,false)}
        ></div>

        {/* 프로퍼티 탭 */}.
        <div className = "right-panel">
          {<EquipProperty lockObject={lockObject}/>}
        </div>

        {/* 로그 윈도우 */}
        <div id = "log">
          <LogWindow />
        </div>
      </div>
    );
  }

  const renderNoneMode =()=>{
    return (
      <div
        id="viewerMode"
        style={{
          gridTemplateColumns :buildGridTemplateColumns(globalState.editorMode)
        }}
      >

        {/* 로그 윈도우 */}
        <div id = "log">
          <LogWindow />
        </div>
      </div>
    );
  }


  return (
    <>
      {renderMode(globalState.editorMode)}
    </>
  );
}

export default App;