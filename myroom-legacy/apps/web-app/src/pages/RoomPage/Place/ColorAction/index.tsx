import React, { useCallback, useState } from 'react';
import { IDataWebColors } from 'client-core/tableData/defines/System_InternalData';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import style from './style.module.scss';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import Text from '@/components/Text';
import CustomButton from '@/components/Buttons/CustomButton';
import useRoom from '@/common/hooks/use-room';
import { SceneManager } from '@/common/utils/client';

const ColorAction = (): React.ReactElement => {
  const { roomBackgroundColor, setRoomBackgroundColor } = useRoom();
  const [selectedColorId, setSelectedColorId] = useState<string>(""); 
  const [expanded, setExpanded] = useState(false);


  // React.useEffect(() => {
  //   Object.values(IDataWebColors).map((color) => {
  //     if(color.hex === roomBackgroundColor) {
  //       setCurrentColorId(color.ID);
  //       return;
  //     }
  //   });
  // }, [])

  const handleClickSave = useCallback(async () => {
    if (selectedColorId) {
      const hexCode = IDataWebColors[selectedColorId].hex;
      setRoomBackgroundColor(hexCode);
      SceneManager.Room?.setBackgroundColor(hexCode);
    }

    setSelectedColorId("");
    setExpanded(false);
    // if(meProfileId) {
    //   await mutationPostProfile.mutateAsync({
    //     profileId : meProfileId, 
    //     data:{
    //       option : {
    //         background_color : IDataWebColors[currentColorId].hex
    //       }
    //     }
    //   });

    // }
  }, [selectedColorId, setRoomBackgroundColor]);

  const handleClickToggle = useCallback(() => {
    setSelectedColorId("");
    setExpanded(prev=> !prev);
  }, []);

  
  const handleClickColor = useCallback((id: string) => () => {
    setSelectedColorId(id);
  }, []);

  const ColorList = useCallback(()=>{
    return (
      <div className={style.listBox}>
        <CircleButton size='xs' onClick={handleClickToggle} shape={'none'} className={style.icon} variant='black'>
          <Icon name={`Filter_S_On`}/>
        </CircleButton>
        <div className={style.list}>
          {Object.entries(IDataWebColors).map((el) =>             
            <CircleButton
              onClick={handleClickColor(el[1].ID)}
              className={style.color}
              style={{ backgroundColor: el[1].hex }}
              key={el[1].ID}
              shape="circle"
              variant="none"
              size="xxs"
              border={selectedColorId === el[1].ID? 'white' : 'none'}
            >
              {roomBackgroundColor === el[1].hex  && <Icon name={`Btn_Check_SSS`}/>}
            </CircleButton>
          )}
        </div>
        <CircleButton onClick={handleClickSave} className={style.colorOptSaveBtn} size="xxs" shape="circle" variant={selectedColorId !== ""? "primary": "none"}>
          <Icon name={`check_Ring_SS`} />
        </CircleButton>
      </div>
    )
  }, [handleClickColor, handleClickSave, handleClickToggle, roomBackgroundColor, selectedColorId]);

  return (
    <motion.div 
      className={classNames(style.colorOptionContainer)}
      initial="minimal"
      animate={expanded ? 'expanded' : 'minimal'}
      variants={{
        minimal : {

        },
        expanded : {
          width: "calc(100% - 40px)"
        }
    }}
    >
      {expanded?  <ColorList />:
      <CustomButton onClick={handleClickToggle} className={style.minimal}>
        <Icon name={`Filter_S_On`} className={style.icon}/>
        <Text locale={{textId: "GMY.000182"}}/>
      </CustomButton>} 
    </motion.div>
  )
}

export default ColorAction;