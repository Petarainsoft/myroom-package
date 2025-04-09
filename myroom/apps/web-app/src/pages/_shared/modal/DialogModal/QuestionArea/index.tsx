import style from './style.module.scss';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import joysamText from '@/assets/joysam.json';
import { TypeAnimation } from 'react-type-animation';
import { t } from 'i18next';
import React from 'react';

type QuestionAreaProps = {
  textId: string | undefined;
  showNext: boolean;
  onNext: () => void;
  showPrev: boolean;
  onPrev: () => void;
  showFullText: boolean;
  setShowFullText: (set: boolean) => void;
  showQuestionIndex: boolean;
  questionIndex: number;
  showQuestionBg: boolean;
  textAlign?: 'left' | 'center';
  textSize?: 's' | 'm';
};

const QuestionArea = ({
  textId,
  showNext,
  onNext,
  showPrev,
  onPrev,
  showFullText,
  setShowFullText,
  showQuestionIndex,
  questionIndex,
  showQuestionBg,
  textAlign = 'left',
  textSize = 's',
}: QuestionAreaProps) => {
  /** TypeAnimation이 캐싱됨으로 컴포넌트채로 생성해줘야함. */
  const textString = t(textId ?? 'undefined!').replace(/\\n/g, '\n');
  console.log('textId : ', textId, ' textString : ', textString);
  const AnimationText = React.useCallback(() => {
    return (
      <TypeAnimation
        sequence={[
          0,
          () => {},
          textString,
          () => {
            setShowFullText(true);
          },
        ]}
        repeat={1}
        omitDeletionAnimation={true}
        key={textId}
      />
    );
  }, [textId]);

  const onText = React.useCallback(() => {
    if (!showFullText) setShowFullText(true);
    else if (showNext) onNext();
  }, [showFullText]);

  const onClickPrev = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onPrev();
      event.stopPropagation();
    },
    [],
  );

  const onClickNext = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onNext();
      event.stopPropagation();
    },
    [],
  );

  return (
    <div className={style.body}>
      {showQuestionIndex && questionIndex > 0 ? (
        <div className={style.questionIndexWrapper}>
          <span className={style.questionIndex}>{`Q.${questionIndex}`}</span>
        </div>
      ) : null}
      <div
        className={`${style.inner_body} ${
          showQuestionBg ? style.hasBgColor : ''
        }`}
        onClick={onText}
      >
        <div className={`${style.text} ${style[textAlign]} ${style[textSize]}`}>
          {showFullText ? <Text text={textString} /> : <AnimationText />}
        </div>
        {showPrev || showNext ? (
          <div className={style.button_area}>
            {showPrev && (
              <CustomButton className={style.prev_button} onClick={onClickPrev}>
                <div className={style.prev_icon}>
                  <Icon name="joysam/Arrow_drop_left" />
                </div>
                <div className={style.prev_text}>
                  <Text text={joysamText['JOY.000009']} />
                </div>
              </CustomButton>
            )}

            {showNext && (
              <CustomButton className={style.next_button} onClick={onClickNext}>
                <div className={style.next_text}>
                  <Text text={joysamText['JOY.000010']} />
                </div>
                <div className={style.next_icon}>
                  <Icon name="joysam/Arrow_drop_right" />
                </div>
              </CustomButton>
            )}
          </div>
        ) : (
          <div className={style.noButtonMargin}></div>
        )}
      </div>
    </div>
  );
};

export default QuestionArea;
