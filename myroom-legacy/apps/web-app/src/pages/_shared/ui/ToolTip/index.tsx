import { ButtonHTMLAttributes } from 'react';
import CircleButton from '../../../../components/Buttons/CircleButton';
import Icon from '../../../../components/Icon';
import style from './style.module.scss';
export type ToolTipProp = ButtonHTMLAttributes<HTMLDivElement> & {
  className?: string;
  shape:'lt'|'rt';
  showClose:boolean;
  children?:JSX.Element|JSX.Element[]|React.ReactElement
  handleClose?: () => void;
};

const ToolTip = ({ shape='lt', showClose, handleClose, children, className }: ToolTipProp) => {
  return (
    <div className={`${style.toolTip} ${className} ${style[shape]}`}>
      {showClose?
      <CircleButton
        shape="circle"
        size="xxs"
        className={style.btnClose}
        onClick={handleClose}
      >
        <Icon name="Close_One_S" />
      </CircleButton>
      :null}
      <div className={style.content}>{children}</div>
    </div>
  );
};
export default ToolTip;
