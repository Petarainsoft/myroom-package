import ReactModal from 'react-modal';
import './style.scss';

const PopupCore = ({
  children,
  className = '',
  style,
  ...rest
}: ReactModal.Props) => {
  const customStyle: ReactModal.Styles = {
    overlay: {
      zIndex: 50,
      position: 'fixed',
      height: '100dvh',
      backgroundColor: 'none',
      // minHeight: '-webkit-fill-available',
      ...style?.overlay,
    },
    content: {
      inset: 0,
      border: 0,
      outline: 'none',
      padding: 0,
      borderRadius: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignContent: 'center',
      position: 'fixed',
      height: '100dvh',
      width: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      ...style?.content,
    },
  };

  return (
    <ReactModal
      style={customStyle}
      // className={`${rest.className} ${styles.coreModal}`}
      className={`${className} coreModal`}
      {...rest}
    >
      {children}
    </ReactModal>
  );
};

export default PopupCore;
