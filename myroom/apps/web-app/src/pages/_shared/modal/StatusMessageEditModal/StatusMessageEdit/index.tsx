import React, { useEffect, useRef, useState } from 'react';
import style from './style.module.scss';
import { useAtom } from 'jotai';
import { statusMessageTempInputAtom } from '@/common/stores';
import usePopup from '@/common/hooks/Popup/usePopup';
import Text from '@/components/Text';
import {
  getByteLength,
  truncateToByteLength,
} from '@/common/utils/string-format';
const MAX_SCROLL_WIDTH = 155;
const MAX_LENGTH = 48;
const FONT_SIZE = 16;
const StatusMessageEdit = () => {
  const [statusMessageITempInput, setStatusMessageTempInput] = useAtom(
    statusMessageTempInputAtom,
  );
  const { showToastPopup } = usePopup();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOverWidthFlag, setIsOverWidthFlag] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    // console.log('value', value);
    if (getByteLength(value) > MAX_LENGTH) {
      const truncatedString = truncateToByteLength(value, MAX_LENGTH);
      setStatusMessageTempInput(truncatedString);
      showToastPopup({
        titleText: (
          <Text
            locale={{ textId: 'GMY.000010' }}
            defaultValue="최대 48byte까지 입력 가능합니다"
          />
        ),
      });
      return;
    }
    setStatusMessageTempInput(value);
  };

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const resizingContent = () => {
    if (!textareaRef.current) return;
    const style = textareaRef.current.style;
    //순서 중요
    style.height = `${FONT_SIZE}px`;
    style.overflowY = 'hidden';

    //2줄 이상일 때 height 관련 (순서 중요)
    style.overflowY = isOverWidthFlag ? 'auto' : 'hidden';
    style.whiteSpace = isOverWidthFlag ? 'break-spaces' : 'nowrap';
    style.wordBreak = isOverWidthFlag ? 'break-all' : 'inherit';

    //width
    style.width = 'auto';
    style.width = '1px'; //font size
    style.width = isOverWidthFlag
      ? `${MAX_SCROLL_WIDTH}px`
      : `${textareaRef.current?.scrollWidth}px`;

    //height
    style.height = isOverWidthFlag
      ? `${textareaRef.current?.scrollHeight}px`
      : `${FONT_SIZE}px`;

    setTimeout(() => {
      if (!textareaRef.current) return;
      //넓이 최대로 늘어나고(isOverWidthFlag:true) 2줄 이상 되었다가 1줄이 될 때
      if (
        isOverWidthFlag &&
        textareaRef.current.scrollHeight < FONT_SIZE * 2 - 2
      ) {
        setIsOverWidthFlag(false);
        return;
      }
    }, 0);
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    const isOverWidth = textareaRef.current.scrollWidth > MAX_SCROLL_WIDTH;
    if (isOverWidth) {
      setIsOverWidthFlag(true);
    }
  }, [statusMessageITempInput]);

  useEffect(() => {
    resizingContent();
  }, [statusMessageITempInput, isOverWidthFlag]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
  }, []);

  return (
    <div className={style.statusMessageITempInputWrapper}>
      <div className={style.statusMessageITempInput}>
        <textarea
          wrap="off"
          ref={textareaRef}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          cols={20}
          rows={2}
          style={{}}
          value={statusMessageITempInput}
        />
      </div>
    </div>
  );
};
export default StatusMessageEdit;
