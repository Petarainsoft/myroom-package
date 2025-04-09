import { VariantType } from '@/common/types';
import style from './style.module.scss';
import cx from 'classnames';
import TextareaAutosize, {
  TextareaAutosizeProps,
} from 'react-textarea-autosize';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import useResizeObserver from 'use-resize-observer';

type TextAreaProps = TextareaAutosizeProps & {
  variant: VariantType;
  fixedText?: string;
  buttonOptions?: {
    element?: React.ReactNode;
  };
};
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const { fixedText, variant, buttonOptions, onChange, ...rest } = props;
  const { ref: fixedRef, width = 1} = useResizeObserver<HTMLDivElement>();

  const [showFixedText, setShowFixedText] = useState<boolean>(
    fixedText !== undefined,
  );


  const handleScroll = useCallback((e: any) => {
    setShowFixedText(e.currentTarget.scrollTop === 0);
  }, []);

  const handleChange = useCallback(
    (e: any) => {
      setShowFixedText(e.currentTarget.scrollTop === 0);

      if (onChange) onChange(e);
    },
    [onChange],
  );


  const textIndent = useMemo(() => {
    return fixedText
      ? `${width + 5}px`
      : '0px';
  }, [fixedText, width]);

  return (<div className={cx(style['wrap'], style[variant])}>
        <div className={style['text-box']}>
          <TextareaAutosize
            {...rest}
            onScroll={handleScroll}
            style={{ textIndent }}
            onChange={handleChange}
            ref={ref}
          ></TextareaAutosize>
          {showFixedText && (
            <div ref={fixedRef} className={style['fixed-text']}>
              {fixedText}
            </div>
          )}
        </div>
        <div className={style['box']}>{buttonOptions?.element}</div>
      </div>);
});

export default TextArea;
