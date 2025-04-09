import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import React from 'react';
import { getLocaleText } from '@/common/utils/text';

export type TextLocale = {
  textId: string;
  values?: any;
};

export type TextCoreProps = {
  locale?: TextLocale;
  text?: string;
  hasTag?: boolean;
  defaultValue?: string;
};

const TextCore = ({
  locale,
  text,
  hasTag = false, // defaultValue,
}: TextCoreProps) => {
  const contents = React.useMemo(() => {
    if (text) {
      return hasTag ? parse(DOMPurify.sanitize(text)) : text;
    } else if (locale) {
      return getLocaleText(locale.textId, locale.values, hasTag);
    } else {
      return 'TEXT';
    }
  }, [locale, text, hasTag]);

  return <React.Fragment>{contents}</React.Fragment>;
};

export default TextCore;
