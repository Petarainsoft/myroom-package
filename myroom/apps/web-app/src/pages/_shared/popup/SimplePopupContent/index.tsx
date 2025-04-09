import Button from '@/components/Buttons/Button';
import './style.scss';
import Text from '@/components/Text';
interface ISimplePopupContent {
  titleText?: string | JSX.Element | JSX.Element[];
  contentText?: string | JSX.Element | JSX.Element[];
  handleConfirm: () => void;
  handleCancel?: () => void;
  confirmText?: string | JSX.Element | JSX.Element[];
  cancelText?: string | JSX.Element | JSX.Element[];
}

const SimplePopupContent = ({
  titleText,
  contentText,
  handleConfirm,
  handleCancel,
  cancelText,
  confirmText,
}: ISimplePopupContent) => {
  return (
    <div className="simple-popup-wrapper">
      {titleText && <div className="simple-popup-title">{titleText}</div>}
      {contentText && <div className="simple-popup-content">{contentText}</div>}
      <div className="simple-popup-button-wrapper">
        {handleCancel && (
          <Button
            onClick={handleCancel}
            variant="none"
            shape="capsule"
            size="l"
          >
            {cancelText ?? <Text locale={{ textId: 'GCM.000026' }} />}
          </Button>
        )}
        <Button onClick={handleConfirm} shape="capsule" size="l">
          {confirmText ?? <Text locale={{ textId: 'GCM.000003' }} />}
        </Button>
        {/* test */}
      </div>
    </div>
  );
};

export default SimplePopupContent;
