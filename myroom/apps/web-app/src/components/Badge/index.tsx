import style from './style.module.scss';

type BadgeProps = {
  placement?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
};

const Badge = ({ placement = 'bottom-start' }: BadgeProps) => {
  return (
    <span className={`${style['badge-wrap']} ${style[placement]} `}></span>
  );
};

export default Badge;
