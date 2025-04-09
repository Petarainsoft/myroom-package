import DOMPurify from 'dompurify';
import { t } from 'i18next';
import parse from 'html-react-parser';

export const getLocaleText = (
  textId: string,
  values?: any,
  hasTag?: boolean,
) => {
  return hasTag
    ? parseTagString(t(textId, values).toString())
    : t(textId, values).toString();
};
export const parseTagString = (text: string) => {
  return parse(DOMPurify.sanitize(text));
};
