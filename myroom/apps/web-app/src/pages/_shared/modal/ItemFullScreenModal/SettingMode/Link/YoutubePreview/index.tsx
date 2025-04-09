import styles from './styles.module.scss';

type YutubePreviewProps = {
  src: string;
};

const YutubePreview = ({ src }: YutubePreviewProps) => {
  return (
    <iframe
      className={styles['preview']}
      width="100%"
      height="100%"
      src={src}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    ></iframe>
  );
};

export default YutubePreview;
