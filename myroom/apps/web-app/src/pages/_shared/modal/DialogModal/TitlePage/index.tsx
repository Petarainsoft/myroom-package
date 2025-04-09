import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Image from '@/components/Image';
import Skeleton from '@/components/Skeleton';
import CustomButton from '@/components/Buttons/CustomButton';
import share from '@/common/utils/share';

export type StatPageProps = {
  dialogId: string;
  titleTextId: string | undefined;
  startTextId: string | undefined;
  titleButtonTextId: string | undefined;
  titleImage: string | undefined;
  onClickStart: () => void;
  handleClose: () => void;
};
const TitlePage = ({
  dialogId,
  titleTextId = '',
  startTextId = '',
  titleButtonTextId = '',
  titleImage = '',
  onClickStart,
  handleClose,
}: StatPageProps) => {
  const onClickShare = () => {
    share({
      url: `https://myroom.develop.colorver.se/joysam-dialog-test?dialogId=${dialogId}`,
    });
  };
  return (
    <div className={style.dialogTitlePage}>
      <div className={style.header}>
        <CircleButton
          className={style.btnClose}
          shape="circle"
          size="s"
          onClick={handleClose}
        >
          <Icon name="Close_M" />
        </CircleButton>
      </div>

      <div className={style.titleWrapper}>
        <Icon name="joysam/B2B_Title" className={style.titleStroke} />
        <div className={style.titleText}>
          <Text locale={{ textId: titleTextId }} />
        </div>
        <div className={style.startText}>
          <Text locale={{ textId: startTextId }} />
        </div>
      </div>
      <div className={style.body}>
        <div className={style.titleImage}>
          <Skeleton>
            <Image name={`dialog/${titleImage}`} />
          </Skeleton>
        </div>
      </div>
      <div className={style.footer}>
        <CustomButton className={style.btnShare} onClick={onClickShare}>
          <Text
            locale={{ textId: 'DLG.MQ01TestShare' }}
            defaultValue="테스트 공유하기"
          />
        </CustomButton>
        <CustomButton className={style.btnStart} onClick={onClickStart}>
          <Text
            locale={{ textId: titleButtonTextId }}
            defaultValue="테스트 시작"
          />
        </CustomButton>
      </div>
    </div>
  );
};
export default TitlePage;
