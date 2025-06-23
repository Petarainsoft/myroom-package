import style from './style.module.scss';
import { Modal } from '@/components/_core/ModalCore';
import React, { useCallback, useMemo } from 'react';
import { ReactDialogSystem } from '@/common/dialog';
import Header from './Header';
import QuestionArea from './QuestionArea';
import AnswerArea from './AnswerArea';
import CanvasBody from '../JoysamModal/JoysamModelInfoModal/CanvasBody';
import View from '@/pages/_shared/layouts/View';
import TitlePage from './TitlePage';
import ResultPage from './ResultPage';
import Image from '@/components/Image';
import { useNavigate } from 'react-router-dom';
import { KHHomeUrl } from '@/pages/KHHome';

type DialogInfoProps = {
  dialogId: string;
  dialogResultId?: string;
  onRequestClose: any;
  closeCallback?: () => void;
};

const defaultStyle: ReactModal.Styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100dvh',
    backgroundColor: 'transparent',
  },
  content: {
    outline: 'none',
    border: 0,
    backgroundColor: 'transparent',
  },
};

// todo : 다른 테마를 어떻게 바꿀 것인가?
const JoysamThema = {
  colors: {
    text: '#222222',
    secondary1: '#2073F6',
    secondary2: '#FF2164',
    secondary3: '#DBFC3D',
  },
};

const DialogModal = ({
  dialogId,
  dialogResultId,
  onRequestClose,
  closeCallback,
}: DialogInfoProps) => {
  React.useLayoutEffect(() => {
    const $rootStyle = document.documentElement.style;
    if ($rootStyle) {
      const thema = JoysamThema;
      $rootStyle.setProperty('--dialog-text-color', thema.colors.text);
      $rootStyle.setProperty(
        '--dialog-secondary-color1',
        thema.colors.secondary1,
      );
      $rootStyle.setProperty(
        '--dialog-secondary-color2',
        thema.colors.secondary2,
      );
      $rootStyle.setProperty(
        '--dialog-secondary-color3',
        thema.colors.secondary3,
      );

      // const rootStyles = getComputedStyle(document.documentElement);
      // const joysamMaxWidth = rootStyles.getPropertyValue('--joysam-max-width').trim();
      // $rootStyle.setProperty('--dialog-max-width', joysamMaxWidth);
    }
  }, []);

  const reactDialogSystem = React.useMemo(() => {
    const system = new ReactDialogSystem();
    system.startDialog(dialogId, dialogResultId);
    return system;
  }, [dialogId, dialogResultId]);

  reactDialogSystem.use();
  const navigate = useNavigate();

  const dialogSystem = reactDialogSystem.getDialogSystem();
  if (!dialogSystem) {
    throw new Error('DialogSystem is null');
  }

  const onClose = useCallback(() => {
    if (closeCallback) closeCallback();
    onRequestClose();

    const id = dialogSystem.getDialogId();
    if (id === 'HC01' || id === 'HC02') navigate(KHHomeUrl);
  }, [dialogId, dialogResultId, onRequestClose, closeCallback]);

  const onNext = useCallback(() => {
    dialogSystem.goToNext();
    if (dialogSystem.isFinished()) {
      if (dialogSystem.hasResult()) {
        dialogSystem.endDialog();
      } else {
        // 닫는다.
        onClose();
      }
    }
  }, []);

  const onAnswerTouch = useCallback((id: string) => {
    if (dialogSystem.getSelectedAnswerId() === id) onNext();
    else dialogSystem.selectAnswer(id);
  }, []);

  const onSkip = useCallback(() => {
    dialogSystem.skip();
  }, []);

  const curAnswerId = dialogSystem.getSelectedAnswerId();
  React.useEffect(() => {
    // 0.5초후에 answer touch를 호출한다.
    //console.error("curAnswerId", curAnswerId);
    let timeId: number | undefined;
    if (curAnswerId) {
      timeId = window.setTimeout(() => {
        if (curAnswerId) onAnswerTouch(curAnswerId);
      }, 500);
    }
    return () => {
      window.clearTimeout(timeId);
    };
  }, [curAnswerId, onAnswerTouch]);

  const tellerId = dialogSystem.getDialogNpcId();
  if (tellerId) {
    if (defaultStyle.content)
      defaultStyle.content.backgroundColor = 'rgba(255,255,255,1)';
  }
  const onClickStart = useCallback(() => {
    dialogSystem.startDialog();
    reactDialogSystem.updateUi(true);
  }, [dialogSystem, reactDialogSystem]);
  const onClickRetry = useCallback(() => {
    dialogSystem.retryDialog();
    reactDialogSystem.updateUi(true);
  }, [dialogSystem, reactDialogSystem]);

  const BackgroundImageVideo = useMemo(
    () => () => {
      const path = dialogSystem.getBackgroundImageVideo();
      if (path === '') return null;
      let imageVideoElement: React.ReactElement | null = null;
      if (path.endsWith('.mp4')) {
        imageVideoElement = (
          <video
            className={style.video}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
          >
            <source src={path} type="video/mp4"></source>
          </video>
        );
      } else {
        imageVideoElement = <Image className={style.image} src={path} />;
      }

      return (
        <div className={style.backgroundImageVideo}>{imageVideoElement}</div>
      );
    },
    [dialogSystem.getBackgroundImageVideo()],
  );
  return (
    <Modal isOpen={true} className={style.modal} styles={defaultStyle}>
      <View disableNavigation={true}>
        {dialogSystem.isStartedDialog() && tellerId && (
          <div className={style.canvasBG}>
            <div className={style.avatarWrapper}>
              <CanvasBody
                itemId={tellerId}
                className={style.canvas}
                checkChangeItemId={false}
              />
            </div>
          </div>
        )}
        {dialogSystem.isStartedDialog() ? (
          <div className={style.body}>
            <Header
              onClose={onClose}
              onSkip={onSkip}
              showSkip={dialogSystem.canSkip()}
              showProgress={dialogSystem.hasTitlePage()}
              progressRatio={dialogSystem.getProgressRatio()}
              showPrev={
                dialogSystem.hasTitlePage() && dialogSystem.canGoToPrev()
              }
              onPrev={() => {
                dialogSystem.goToPrev();
              }}
            />
            <div className={style.body2}>
              <div className={style.inner_body}>
                <BackgroundImageVideo />
                <div className={style.headerHeight}></div>
                <QuestionArea
                  textId={dialogSystem.getDialogQuestionId()}
                  showNext={dialogSystem.hasNextQuestion()}
                  onNext={onNext}
                  showPrev={false} // question area 에서는 prev 버튼을 표시하지 않는다. (header에 표시).
                  onPrev={() => {
                    dialogSystem.goToPrev();
                  }}
                  showFullText={reactDialogSystem.isShowingFullText()}
                  setShowFullText={(set: boolean) => {
                    reactDialogSystem.showFullText(set);
                  }}
                  showQuestionIndex={dialogSystem.hasTitlePage()}
                  questionIndex={dialogSystem.getQuestionIndex()}
                  showQuestionBg={!dialogSystem.hasTitlePage()}
                  textAlign={
                    dialogSystem.getBackgroundImageVideo() === '' &&
                      dialogSystem.hasTitlePage()
                      ? 'center'
                      : 'left'
                  }
                  textSize={dialogSystem.hasTitlePage() ? 'm' : 's'}
                />
                <AnswerArea
                  answerList={dialogSystem.getDialogAnswerList()}
                  selectedId={dialogSystem.getSelectedAnswerId()}
                  borderRound={!dialogSystem.hasTitlePage()}
                  onTouch={onAnswerTouch}
                />
              </div>
            </div>
          </div>
        ) : dialogSystem.hasResult() && dialogSystem.isFinished() ? (
          <ResultPage
            dialogMainId={dialogId}
            resultId={dialogSystem.getResultId()}
            titleTextId={dialogSystem.getTitleTextId()}
            imageName={dialogSystem.getResultImageName()}
            mainTellerId={tellerId}
            animationItemId={dialogSystem.getResultAnimationItemId()}
            subTitleTextId0={dialogSystem.getResultSubTitleTextId0()}
            mainTitleTextId0={dialogSystem.getResultMainTitleTextId0()}
            subTitleTextId1={dialogSystem.getResultSubTitleTextId1()}
            mainTitleTextId1={dialogSystem.getResultMainTitleTextId1()}
            resultTextId1={dialogSystem.getResultTextId1()}
            subTitleTextId2={dialogSystem.getResultSubTitleTextId2()}
            mainTitleTextId2={dialogSystem.getResultMainTitleTextId2()}
            resultTextId2={dialogSystem.getResultTextId2()}
            handleRetry={onClickRetry}
            handleClose={onClose}
          />
        ) : (
          <TitlePage
            dialogId={dialogId}
            titleTextId={dialogSystem.getTitleTextId()}
            startTextId={dialogSystem.getStartTextId()}
            titleButtonTextId={dialogSystem.getTitleButtonTextId()}
            titleImage={dialogSystem.getTitleImage()}
            onClickStart={onClickStart}
            handleClose={onClose}
          />
        )}
      </View>
    </Modal>
  );
};

export default DialogModal;
