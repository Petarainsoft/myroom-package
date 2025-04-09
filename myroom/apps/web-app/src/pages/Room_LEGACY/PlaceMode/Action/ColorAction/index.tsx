import React from 'react';
import { useAtom } from 'jotai';
import { initialColorIdxAtom, myRoomBgColorAtom, uiBgColorOption } from '@/common/stores';
import { SceneManager } from '@/common/utils/client';
import { logger } from '@/common/utils/logger';
import { IDataWebColors } from 'client-core/tableData/defines/System_InternalData';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import style from './style.module.scss';

const ColorActionOpt = (): React.ReactElement => {
  const [uiBgColorOpt, setUiBgColorOpt] = useAtom(uiBgColorOption);
  const [myRoomBgColor, setMyRoomBgColor] = useAtom(myRoomBgColorAtom);
  const [initialColorIdx, setInitialColorIdx] = useAtom(initialColorIdxAtom);
  const [colorIdx, setColorIdx] = React.useState<string>('0');

  React.useEffect(() => {
    Object.values(IDataWebColors).map((color) => {
      if(color.hex === myRoomBgColor) {
        setColorIdx(color.ID);
        setInitialColorIdx(color.ID);
        return;
      }
    });

  }, [])

  const handleColorSave = () => {
    logger.log('handleColorSave');
    SceneManager.Room?.setBackgroundColor(IDataWebColors[colorIdx].hex);
    setUiBgColorOpt(false);
  };

  const handleColorToggle = () => {
    logger.log('handleColorToggle ', uiBgColorOpt);
    if (uiBgColorOpt) {
      const callback = (manifest: any) => {
        if (!manifest) return;
        setMyRoomBgColor(manifest.main.room.backgroundColor);
      };
      SceneManager.Room?.makeMyRoomManifest(callback);
      setColorIdx(initialColorIdx);
    }
    setUiBgColorOpt(!uiBgColorOpt);
  };

  /** 실제 색 설정은 html canvas에 하지만, 저장 시 및 불러오기는 클라이언트 담당 */
  const handleColorSelect = (idx: string) => () => {
    logger.log('handleColorSelect ', IDataWebColors[idx]);
    setColorIdx(IDataWebColors[idx].ID); // UI 표시 설정
    setMyRoomBgColor(IDataWebColors[idx].hex); // 실제 색 적용  *** 주의 SceneManager.Room?.setBackgroundColor 아님.
  };

  return (
    <div 
      className={
        `${style.colorOptionContainer} 
        ${uiBgColorOpt ? style.expanded : ''}`
      }
    >
      <CircleButton
        onClick={handleColorToggle}
        className={style.colorOptExpandBtn}
        size="m"
        shape="circle"
        variant="black"
      >
        <Icon name={`Filter_L_On`} />
      </CircleButton>
      <div className={style.colorOptionListContainer}>
        <div className={style.colorOptionList}>
          {Object.entries(IDataWebColors).map((el) =>             
            <CircleButton
              onClick={handleColorSelect(el[1].ID)}
              className={style.colorOptBtn}
              style={{ backgroundColor: el[1].hex }}
              key={el[1].ID}
              shape="circle"
              variant="none"
              size="m"
            >
              {colorIdx === el[1].ID && <Icon name={`Btn_Check_SS`} />}
            </CircleButton>
          )}
        </div>
      </div>
      <CircleButton
        onClick={handleColorSave}
         className={style.colorOptSaveBtn}
        size="m"
        shape="circle"
      >
        <Icon name={`Check_Ring_L`} />
      </CircleButton>
    </div>
  )
}

export default ColorActionOpt;