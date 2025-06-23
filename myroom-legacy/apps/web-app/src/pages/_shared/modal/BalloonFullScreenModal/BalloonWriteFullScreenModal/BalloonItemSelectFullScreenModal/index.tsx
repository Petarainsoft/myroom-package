import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import titleStyle from '../../titleStyle.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Button from '@/components/Buttons/Button';
import { useEffect, useState } from 'react';
import useBalloonItemListFilter from '../BalloonItemList/balloonItemListFilterHooks';
import BalloonItemCell from '../BalloonItemCell';
import Text from '@/components/Text';
interface IBalloonItemSelectFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  initSelectedBalloonId: string;
  handleSelectFinished: (balloonId: string) => void;
}
const BalloonItemSelectFullScreenModal = ({
  initSelectedBalloonId,
  handleSelectFinished,
  onRequestClose,
}: IBalloonItemSelectFullScreenModal) => {
  const { listType, balloonItemList, handleChangeListType } =
    useBalloonItemListFilter();
  const [selectedBalloonId, setSelectedBalloonId] = useState('');
  useEffect(() => {
    setSelectedBalloonId(initSelectedBalloonId);
  }, [initSelectedBalloonId]);

  const handleClose = () => {
    setSelectedBalloonId(initSelectedBalloonId);
    onRequestClose();
  };
  const onClickSelected = () => {
    handleSelectFinished(selectedBalloonId);
    onRequestClose();
  };
  const handleClickBalloonItem = (id: string) => {
    setSelectedBalloonId(id);
  };
  const ListTypeButton = ({
    type,
    btnTextId,
  }: {
    type: string;
    btnTextId: string;
  }) => {
    return (
      <CustomButton
        className={`${style.btnListType} ${
          listType === type ? style.on : style.off
        }`}
        onClick={handleChangeListType}
        value={type}
      >
        <Text locale={{ textId: btnTextId }} />
      </CustomButton>
    );
  };
  const Header = () => {
    return (
      <div className={titleStyle.title}>
        <div className={titleStyle.leftSide}>
          <CustomButton className={titleStyle.btnBack} onClick={handleClose}>
            <Icon name="Top_Close" />
          </CustomButton>
          <span>
            <Text locale={{ textId: 'GMY.000177' }} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={true}>
      <div className={style.background}>
        <Header />
        <div className={style.listType}>
          <div className={style.scrollArea}>
            <ListTypeButton type="all" btnTextId="GCM.000008" />
            <ListTypeButton type="free" btnTextId="GMY.000046" />
            <ListTypeButton type="paid" btnTextId="GMY.000047" />
          </div>
        </div>

        <div className={style.list}>
          {balloonItemList
            ? balloonItemList.map((data) => (
                <BalloonItemCell
                  className={style.balloonItem}
                  selectedId={selectedBalloonId}
                  key={data._id}
                  data={data}
                  handleClick={handleClickBalloonItem}
                />
              ))
            : null}
        </div>

        <Button size="full" shape="rect" onClick={onClickSelected}>
          <Text locale={{ textId: 'GCM.000043' }} />
        </Button>
      </div>
    </Modal>
  );
};
export default BalloonItemSelectFullScreenModal;
