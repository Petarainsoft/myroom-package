import style from './style.module.scss';

type MentionProps = {
    children: string;
}

const Mention = ({children}:MentionProps) => {
    return <span className={style['mention']}>@{children}</span>
}

export default Mention;