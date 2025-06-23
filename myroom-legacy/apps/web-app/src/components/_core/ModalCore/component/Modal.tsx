import React, { memo } from 'react';
import ReactModal from 'react-modal';
import { useMemo } from 'react';
// import { ModalContext } from '../lib';
import PopupCore from '../../PopupCore';

interface ComponentProps {
  className?: string;
  themeCSS?: string;
  [key: string]: any;
}

export interface ModalProps
  extends ComponentProps,
    Omit<Omit<ReactModal.Props, 'isOpen'>, 'className'> {
  isOpen?: boolean;
  isBack?: boolean;
}

export const defaultStyle: ReactModal.Styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100dvh',
    // backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    outline: 'none',
    border: 0,
  },
};

const Component = ({
  themeCSS,
  children,
  className,
  onRequestClose,
  isOpen = true,
  isBack = true,
  ref,
  ...props
}: ModalProps) => {
  const overrideStyle = useMemo(
    (): ReactModal.Styles => ({
      overlay: { ...defaultStyle.overlay, ...(props?.styles?.overlay ?? {}) },
      content: { ...defaultStyle.content, ...(props?.styles?.content ?? {}) },
    }),
    [props.style],
  );
  // const { dispatch } = useContext(ModalContext);
  // const closeModal = useCallback(() => {
  //   dispatch(backCloseModal());
  // }, []);

  return (
    <PopupCore
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={overrideStyle}
      className={className}
      ariaHideApp={false}
      {...props}
    >
      {children}
    </PopupCore>
  );
};
Component.displayName = 'Component';
export const Modal = memo(Component);
