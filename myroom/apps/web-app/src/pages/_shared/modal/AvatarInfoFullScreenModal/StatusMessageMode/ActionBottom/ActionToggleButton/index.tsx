import Toggle from '@/components/Toggle/Toggle';
import style from './style.module.scss';
import Text from '@/components/Text';


type ActionToggleButtonProps = {
  actionStep: string;
  onClick: () => void;
}

const ActionToggleButton = ({ actionStep, onClick}:ActionToggleButtonProps) => {

  return (
    <div className={style.actionToggleButtonWrapper}>
      <div className={style.actonStepText}>
        <Text locale={{ textId: 'GMY.000006' }} defaultValue="2차 액션" />
      </div>
      <Toggle
        isActive={actionStep == '_02'}
        handleIsActive={onClick}
      />
    </div>
  );
};

export default ActionToggleButton;
