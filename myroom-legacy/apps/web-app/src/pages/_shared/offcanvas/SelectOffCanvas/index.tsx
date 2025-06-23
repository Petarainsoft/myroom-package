import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import './style.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import classNames from 'classnames';
import Container from '../../layouts/Container';

export interface ISelectButton {
  textId: string;
  defaultValue?: string;
  onClick: () => Promise<void> | void;
  icon?: string;
}
export interface ISelectOffCanvas {
  isOpen: boolean;
  onClose: () => void;
  height?: number;
  isIconButton?: boolean;
  buttonList: ISelectButton[];
}

const SelectOffCanvas = ({
  isOpen,
  onClose,
  isIconButton = false,
  buttonList,
  height,
}: ISelectOffCanvas) => {
  return (
    <OffCanvas
      key={'SelectOffCanvas'}
      isOpen={isOpen}
      variant={isIconButton ? 'primary' : 'none'}
      onClose={onClose}
      // snapPoints={[height ?? 1]}
      offCanvasClassName={classNames('SelectOffCanvasWrapper', {
        ['iconButtonWrapper']: isIconButton,
        ['textButtonWrapper']: !isIconButton,
      })}
      disableDrag={isIconButton ? false : true}
      // headerNone
      headerOptions={isIconButton ? { disableClose: true } : { disable: true }}
    >
      <Container className={'SelectOffCanvasContainer'}>
        <ul
          className={
            isIconButton ? `${'iconButtonSheet'}` : `${'SelectOffCanvas'}`
          }
        >
          {buttonList.map((button) =>
            button.icon ? (
              <li key={button.textId}>
                <CustomButton onClick={button.onClick} className={'iconButton'}>
                  <Icon name={button.icon} />
                  <div className={'txt'}>
                    <Text locale={{ textId: button.textId }} />
                  </div>
                </CustomButton>
              </li>
            ) : (
              <li key={button.textId} className={'selectButtonWrapper'}>
                <Button
                  className={'selectButton'}
                  shape="capsule"
                  size="full"
                  variant="none"
                  onClick={button.onClick}
                >
                  <Text locale={{ textId: button.textId }} />
                </Button>
              </li>
            ),
          )}
        </ul>
      </Container>
    </OffCanvas>
  );
};

export default SelectOffCanvas;
