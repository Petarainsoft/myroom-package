import React from 'react';

import ModelScene from './components/ModelScene';
import LogWindow from './components/LogWindow';
import { ipcRenderer } from 'electron';
import { ItemModelIconGenerator } from './common/itemModelIconGenerator';

import { Logger } from './common/logger';
import PropertyTab from './components/PropertyTab';
import { useAtom } from 'jotai';
import { iconSettingLockObjectAtom} from './common/stores';
import c from 'ansi-colors'
import './App.scss';

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
  const [pointerInfo, setPointerInfo] = React.useState({startX:0,moveInProgress:false,_moveInProgress:false,leftWidth:0,rightWidth:300});
  const [lockObject] = useAtom(iconSettingLockObjectAtom);

  const onPointerDown = (evt: React.PointerEvent<HTMLDivElement>) => {
    setPointerInfo(preState =>({...preState, startX:evt.clientX,moveInProgress:true}));
    evt.currentTarget.setPointerCapture(evt.pointerId);
  }

  const onPointerUp = (evt: React.PointerEvent<HTMLDivElement>) => {
    setPointerInfo(preState =>( {...preState,moveInProgress:false}));
    evt.currentTarget.releasePointerCapture(evt.pointerId);
  }

  const resizeColumns = (evt: React.PointerEvent<HTMLDivElement>, forLeft = true) => {
    if (!pointerInfo.moveInProgress) {
        return;
    }

    const deltaX = evt.clientX - pointerInfo.startX;
    const rootElement = evt.currentTarget.ownerDocument!.getElementById("icon-generator-root") as HTMLDivElement;

    if (forLeft) {
        let leftWidth = pointerInfo.leftWidth + deltaX;
        leftWidth = Math.max(150, Math.min(400, leftWidth));
        setPointerInfo(preState =>({...preState,leftWidth}));
    } else {
        let rightWidth = pointerInfo.rightWidth - deltaX;
        rightWidth = Math.max(250, Math.min(500, rightWidth));
        setPointerInfo(preState =>({...preState,rightWidth}));
    }

    rootElement.style.gridTemplateColumns = buildGridTemplateColumns();
    setPointerInfo(preState =>({...preState,startX:evt.clientX}));
  }

  const buildGridTemplateColumns = ()=>{
    return `calc(100% - ${pointerInfo.leftWidth + 8 + pointerInfo.rightWidth}px) 4px ${pointerInfo.rightWidth}px`;
  }

  // React.useLayoutEffect(() => {
  //   const $rootStyle = document.documentElement.style;
  //   if ($rootStyle) {
  //     $rootStyle.setProperty('--primary-color', Thema.colors.primary);
  //     $rootStyle.setProperty('--secondary-color', Thema.colors.secondary);
  //     $rootStyle.setProperty('--tertiary-color', Thema.colors.tertiary);
  //     $rootStyle.setProperty('--fail-color', Thema.colors.fail);
  //     $rootStyle.setProperty(
  //       '--default-background-color',
  //       Thema.colors.defaultBackground,
  //     );

  //     Thema.colors.fonts.map((val, idx) => {
  //       $rootStyle.setProperty(`--font-color-${idx + 1}00`, val);
  //     });
  //   }
  // }, []);

  React.useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    ipcRenderer.on('babylon:generateIcons',(event,modleFilePaths, isFromCommand)=>{
      ItemModelIconGenerator.getInstance().generateIcons(modleFilePaths,isFromCommand);
    });

    ipcRenderer.on('babylon:logger:log',(event,msg)=>{
      Logger.log(msg);
    });

    ipcRenderer.on('babylon:logger:error',(event,msg)=>{
      Logger.error(msg);
    });

    ipcRenderer.on('babylon:logger:warn',(event,msg)=>{
      Logger.warn(msg);
    });


    ipcRenderer.on('babylon:copyClipboardCameraSetting',(event)=>{
      ItemModelIconGenerator.getInstance().copyClipboardCameraSetting();
    });

    ipcRenderer.on('babylon:toggleDebugInspector',(event)=>{
      ItemModelIconGenerator.getInstance().toggleDebugLayer();
    });

  }, []);


  return (
    <div
      id="icon-generator-root"
      style={{
        gridTemplateColumns :buildGridTemplateColumns()
      }}
    >
      {/* 씬뷰 */}
      <div id = "scene">
        <ModelScene canvasId='my-canvas'/>
      </div>

      {/* 사이즈 조절 핸들 */}
      <div
          id="right-grab"
          onPointerDown={(evt) => onPointerDown(evt)}
          onPointerUp={(evt) => onPointerUp(evt)}
          onPointerMove={(evt) => resizeColumns(evt, false)}
      ></div>

      {/* 프로퍼티 탭 */}
      <div className = "right-panel">
        <PropertyTab lockObject={lockObject}/>
      </div>

      {/* 로그 윈도우 */}
      <div id = "log">
        <LogWindow />
      </div>
    </div>
  );

}

export default App;