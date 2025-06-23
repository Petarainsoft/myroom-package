import { ChangeEvent } from 'react';
import CheckBox, { CheckBoxProps } from '..';
import Icon from '@/components/Icon';
import style from './style.module.scss';
export type IconCheckBoxProps = CheckBoxProps & {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  checked: boolean;
  icon_on?: string;
  icon_off?: string;
  color_on?: string;
  color_off?: string;
};
const IconCheckBox = ({
  onChange,
  checked,
  icon_on: onIcon = 'Common_Check_M_On',
  icon_off: offIcon = 'Common_Check_M',
  color_on: onColor = '#FFF',
  color_off: offColor = '#FFF',
  children,
  className,
  ...rest
}: IconCheckBoxProps) => {
  return (
    <label className={`${className} ${style.wrapper}`}>
      <CheckBox
        className={style.checkBox}
        onChange={onChange}
        checked={checked}
        {...rest}
      />
      <div
        className={style.iconWrapper}
        style={{ color: checked ? onColor : offColor }}
      >
        <Icon name={checked ? onIcon : offIcon} />
      </div>
      {children}
    </label>
  );
};
export default IconCheckBox;
