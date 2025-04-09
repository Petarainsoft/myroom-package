import PopupCore from '@/components/_core/PopupCore';
import SimplePopupContent from '../SimplePopupContent';

export interface IConfirmPopupCore {
  isOpen: boolean;
  titleText?: string | JSX.Element | JSX.Element[];
  contentText?: string | JSX.Element| JSX.Element[];
  cancelText?: string | JSX.Element| JSX.Element[];
  confirmText?: string | JSX.Element| JSX.Element[];
  handleConfirm: () => void;
  handleCancel?: () => void;
}
const ConfirmPopupCore = ({
  isOpen,
  titleText,
  contentText,
  confirmText,
  cancelText,
  handleConfirm,
  handleCancel,
}: IConfirmPopupCore) => {
  return (
    <PopupCore
      isOpen={isOpen}
      style={{ overlay: { zIndex: 1070 }, content: { zIndex: 1075 } }}
    >
      <SimplePopupContent
        cancelText={cancelText}
        confirmText={confirmText}
        titleText={titleText}
        contentText={contentText}
        handleCancel={handleCancel}
        handleConfirm={handleConfirm}
      />
    </PopupCore>
  );
};

export default ConfirmPopupCore;
