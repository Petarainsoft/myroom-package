import { useAtomValue } from 'jotai';
import useAlertPopup from '@/common/hooks/Popup/useAlertPopup';
import { alertPopupAtom } from '@/common/stores';
import PopupCore from '@/components/_core/PopupCore';
import SimplePopupContent from '../SimplePopupContent';

export interface IAlertPopupCore {
  isOpen: boolean;
  titleText?: string | JSX.Element | JSX.Element[];
  contentText?: string | JSX.Element | JSX.Element[];
  confirmText?: string | JSX.Element | JSX.Element[];
  handleConfirm: () => void;
}
const AlertPopupCore = ({
  isOpen,
  titleText,
  contentText,
  confirmText,
  handleConfirm,
}: IAlertPopupCore) => {
  return (
    <PopupCore
      isOpen={isOpen}
      style={{ overlay: { zIndex: 1080 }, content: { zIndex: 1085 } }}
    >
      <SimplePopupContent
        titleText={titleText}
        contentText={contentText}
        confirmText={confirmText}
        handleConfirm={handleConfirm}
      />
    </PopupCore>
  );
};

export default AlertPopupCore;
