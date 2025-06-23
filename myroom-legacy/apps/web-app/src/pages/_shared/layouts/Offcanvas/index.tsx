import React, { useCallback, useRef } from 'react';
import Sheet, { SheetRef } from 'react-modal-sheet';
import './style.scss';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import { VariantType } from '@/common/types';
import Container from '../Container';
import classNames from 'classnames';

export type OffCanvasHeaderOptions = {
  disable?: boolean;
  disableClose?: boolean;
  customElement?: React.ReactNode;
  disableBottomLine?:boolean;
};

interface IOffCanvas {
  isOpen: boolean;
  onClose: () => void;
  isDimmed?: boolean;
  variant?: VariantType;
  snapPoints?: number[];
  initialSnap?: number;
  disableDrag?: boolean;
  headerOptions?: OffCanvasHeaderOptions;
  shouldCloseOnBackdropClick?: boolean;
  enableFullHeight?: boolean;
  offCanvasClassName?: string;
}

const OffCanvas = ({
  isOpen,
  onClose,
  isDimmed = true,
  shouldCloseOnBackdropClick = true,
  children,
  variant = 'none',
  snapPoints = [1, 0.9, 0.4, 0.1],
  initialSnap = 0,
  disableDrag = false,
  enableFullHeight = false,
  headerOptions,
  offCanvasClassName,

  ...rest
}: IOffCanvas & React.PropsWithChildren) => {
  const ref = useRef<SheetRef>(null);

  const handleClickBackDrop = useCallback(() => {
    if (isDimmed && shouldCloseOnBackdropClick) {
      onClose();
    }
  }, [onClose, isDimmed, shouldCloseOnBackdropClick]);

  return (
    <Sheet
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
      disableDrag={disableDrag}
      className={classNames('offCanvasWrapper', offCanvasClassName)}
      detent={enableFullHeight ? 'full-height' : 'content-height'}
      style={{ height: '100%' }}
      {...rest}
    >
      <React.Fragment>
        <Sheet.Container
          className={'container'}
          style={{
            borderRadius: '20px 20px 0 0',
            zIndex: 1045,
          }}
        >
          {!headerOptions?.disable && (
            <Sheet.Header>
              <Container
                className={classNames('offCanvasHeaderWrapper', variant, headerOptions?.disableBottomLine?'disableBottomLine':'enableBottomLine')}
              >
                <div className={'offCanvasHeader'}>
                  {!disableDrag && <div className={'headerBar'} />}
                  {!headerOptions?.disableClose && (
                    <CustomButton
                      className={'closeBtn'}
                      onClick={() => onClose()}
                    >
                      {<Icon name={'Close_Bottom_S'} />}
                    </CustomButton>
                  )}
                </div>
                {headerOptions?.customElement}
              </Container>
            </Sheet.Header>
          )}
          <Sheet.Content style={{ paddingBottom: ref.current?.y }}>
            <Sheet.Scroller draggableAt="both">{children}</Sheet.Scroller>
          </Sheet.Content>
        </Sheet.Container>
        {isDimmed && (
          <Sheet.Backdrop className={'backdrop'} onTap={handleClickBackDrop} />
        )}
      </React.Fragment>
    </Sheet>
  );
};

export default OffCanvas;
