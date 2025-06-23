import { HtmlHTMLAttributes } from 'react';
import style from './style.module.scss';
export type ITextBadge = HtmlHTMLAttributes<HTMLDivElement> & {
  text: string;
  className?: string;
};

const TextBadge = ({ text, className, ...rest }: ITextBadge) => {
  return (
    <div className={`${style.wrapper} ${className}`} {...rest}>
      {text}
    </div>
  );
};
export default TextBadge;
