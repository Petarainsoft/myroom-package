import CircleButton from '@/components/Buttons/CircleButton';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import CustomButton from '@/components/Buttons/CustomButton';
import { myRoomBgColorAtom } from '@/common/stores';
import { useAtomValue } from 'jotai';
import { CSSProperties } from 'react';
import CanvasBody from '../../JoysamModal/JoysamModelInfoModal/CanvasBody';
import share from '@/common/utils/share';

export type ResultPageProps = {
  dialogMainId?: string;
  resultId?: string;
  titleTextId?: string;
  imageName?: string;
  mainTellerId?: string;
  animationItemId?: string;
  subTitleTextId0?: string;
  mainTitleTextId0?: string;
  subTitleTextId1?: string;
  mainTitleTextId1?: string;
  resultTextId1?: string;
  subTitleTextId2?: string;
  mainTitleTextId2?: string;
  resultTextId2?: string;
  handleRetry: () => void;
  handleClose: () => void;
};
const ResultPage = ({
  dialogMainId,
  resultId,
  titleTextId,
  imageName,
  mainTellerId,
  animationItemId,
  subTitleTextId0,
  mainTitleTextId0,
  subTitleTextId1,
  mainTitleTextId1,
  resultTextId1,
  subTitleTextId2,
  mainTitleTextId2,
  resultTextId2,
  handleRetry,
  handleClose,
}: ResultPageProps) => {
  const myRoomBgColor = useAtomValue(myRoomBgColorAtom);
  const DialogTitle = () => {
    if (!titleTextId) return null;
    return (
      <span className={style.titleText}>
        <Text locale={{ textId: titleTextId }} />
      </span>
    );
  };
  const backgroundStyle = (): CSSProperties => {
    if (imageName)
      return {
        background: `url(/icons/dialog/${imageName}) no-repeat center center`,
        backgroundSize: 'cover',
      };
    else return { backgroundColor: myRoomBgColor };
  };

  const Avatar = () => {
    const itemId = animationItemId !== '' ? animationItemId : mainTellerId;
    if (!itemId) return null;

    return (
      <div className={style.avatarArea}>
        <CanvasBody
          itemId={itemId}
          className={style.canvas}
          checkChangeItemId={false}
        />
      </div>
    );
  };

  const ResultTitle = () => {
    return (
      <div className={style.resultTitleWrapper}>
        {subTitleTextId0 ? (
          <div className={style.subTitle}>
            <Text locale={{ textId: subTitleTextId0 }} hasTag />
          </div>
        ) : null}
        {mainTitleTextId0 ? (
          <div className={style.mainTitle}>
            <Text locale={{ textId: mainTitleTextId0 }} hasTag />
          </div>
        ) : null}
      </div>
    );
  };
  const ResultSection = ({
    subTitleId,
    mainTitleId,
    resultTextId,
  }: {
    subTitleId: string | undefined;
    mainTitleId: string | undefined;
    resultTextId: string | undefined;
  }) => {
    if (!subTitleId && !mainTitleId && !resultTextId) return null;
    return (
      <div className={style.resultSection}>
        {subTitleId ? (
          <div className={style.subTittle}>
            <Text locale={{ textId: subTitleId }} hasTag />
          </div>
        ) : null}
        {mainTitleId ? (
          <div className={style.mainTitle}>
            <Text locale={{ textId: mainTitleId }} hasTag />
          </div>
        ) : null}
        {resultTextId ? (
          <div className={style.resultText}>
            <Text locale={{ textId: resultTextId }} hasTag />
          </div>
        ) : null}
      </div>
    );
  };
  const onClickShare = () => {
    share({
      url: `https://myroom.develop.colorver.se/joysam-dialog-test?dialogId=${dialogMainId}&resultId=${resultId}`,
    });
  };
  return (
    <div className={style.dialogResultPage}>
      <div className={style.scrollArea}>
        <div className={style.background} style={backgroundStyle()}>
          <div className={style.header}>
            <CircleButton
              className={style.btnClose}
              shape="circle"
              size="s"
              onClick={handleClose}
            >
              <Icon name="Close_M" />
            </CircleButton>
            <DialogTitle />
          </div>
          <ResultTitle />
          <Avatar />
        </div>

        <div className={style.body}>
          <ResultSection
            subTitleId={subTitleTextId1}
            mainTitleId={mainTitleTextId1}
            resultTextId={resultTextId1}
          />
          <div className={style.dashedLine}></div>
          <ResultSection
            subTitleId={subTitleTextId2}
            mainTitleId={mainTitleTextId2}
            resultTextId={resultTextId2}
          />
        </div>
      </div>

      <div className={style.footer}>
        <CustomButton className={style.btnShare} onClick={onClickShare}>
          <Text
            locale={{ textId: 'DLG.MQ01ResultShare' }}
            defaultValue="결과 공유하기"
          />
        </CustomButton>
        <CustomButton className={style.btnRetry} onClick={handleRetry}>
          <Text
            locale={{ textId: 'DLG.MQ01TestRetry' }}
            defaultValue="테스트 다시해보기"
          />
        </CustomButton>
      </div>
    </div>
  );
};
export default ResultPage;
