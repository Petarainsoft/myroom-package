import style from './style.module.scss';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import joysamText from '@/assets/joysam.json';
import CircleButton from '@/components/Buttons/CircleButton';

type HeaderProps = {
  onClose: () => void;
  onSkip: () => void;
  showSkip: boolean;
  showProgress: boolean;
  progressRatio: number;
  showPrev: boolean;
  onPrev: () => void;
};

const Header = ({
  onClose,
  onSkip,
  showSkip,
  showProgress,
  progressRatio,
  showPrev,
  onPrev,
}: HeaderProps) => {
  const ProgressBar = () => {
    return (
      <div className={style.progress_back}>
        <div
          className={style.progress}
          style={{ width: `${progressRatio * 100}%` }}
        ></div>
      </div>
    );
  };
  const CloseOrPrevButton = () => {
    if (showPrev) {
      return (
        <CustomButton className={style.prev_button} onClick={onPrev}>
          <Icon name="joysam/Arrow_left_M" />
        </CustomButton>
      );
    }
    return (
      <CircleButton size="s" className={style.close_button} onClick={onClose}>
        <Icon name="Close_M" />
      </CircleButton>
    );
  };
  return (
    <div className={style.header}>
      <CloseOrPrevButton />
      {showProgress ? <ProgressBar /> : null}

      {showSkip && (
        <CustomButton className={style.skip_button} onClick={onSkip}>
          <div className={style.text}>
            <Text text={joysamText['JOY.000008']} />
          </div>
        </CustomButton>
      )}
    </div>
  );
};

export default Header;
