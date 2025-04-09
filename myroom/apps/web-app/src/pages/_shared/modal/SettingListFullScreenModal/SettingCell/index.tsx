import style from './style.module.scss';
import { SettingData } from '..';
import Toggle from '@/components/Toggle/Toggle';
import IconCheckBox from '@/components/Forms/CheckBox/IconCheckBox';
const SettingCell = ({
  data,
  isOn,
  handleOnChange,
}: {
  data: SettingData;
  isOn: boolean;
  handleOnChange: (data: SettingData) => void;
}) => {
  return (
    <div
      className={`${style.settingCellWrapper} ${
        data.parentId ? style.hasParent : ''
      }`}
    >
      <div className={style.top}>
        <div className={style.title}>{data.title}</div>
        <div className={style.rightSide}>
          {data.type === 'checkbox' ? (
            <IconCheckBox
              icon_on="Radio_M_On"
              icon_off="Radio_M"
              checked={isOn}
              onChange={() => {
                handleOnChange(data);
              }}
            />
          ) : null}
          {data.type === 'toggle' ? (
            <Toggle
              isActive={isOn}
              handleIsActive={() => {
                handleOnChange(data);
              }}
            />
          ) : null}
        </div>
      </div>

      {data.desc ? <div className={style.desc}>{data.desc}</div> : null}
    </div>
  );
};
export default SettingCell;
