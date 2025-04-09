import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import Tabs from '../../layouts/Tabs';
import { useState } from 'react';
interface IScrapBookFullScreenModalProps
  extends Omit<ModalProps, 'onRequestClose'> {}
const ScrapBookFullScreenModal = ({
  onRequestClose,
}: IScrapBookFullScreenModalProps) => {
  const [listType, setListType] = useState<'feed' | 'pings'>('feed');
  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton
          size="xs"
          shape="none"
          onClick={() => {
            onRequestClose();
          }}
        >
          <Icon name="Top_Arrow_left_M" />
        </CircleButton>
        <div className={style.headerText}>스크랩 북</div>
      </div>
    );
  };
  const Tab = (): React.ReactElement => (
    <div className={style.social}>
      <Tabs
        elements={[
          {
            textId: '다이어리',
            icon: 'Diary_S',
            selected: listType === 'feed',
            onClick: () => {
              setListType('feed');
            },
          },
          {
            textId: '핑스',
            icon: 'Pings_S',
            selected: listType === 'pings',
            onClick: () => {
              setListType('pings');
            },
          },
        ]}
      ></Tabs>
      {/* {listType === 'feed' ? <FeedList profileId={profileId} /> : <PingsList />} */}
    </div>
  );

  return (
    <Modal isOpen={true}>
      <div className={style.scrapBookWrapper}>
        <Header />
        <Tab />
        <div className={style.body}></div>
      </div>
    </Modal>
  );
};

export default ScrapBookFullScreenModal;
