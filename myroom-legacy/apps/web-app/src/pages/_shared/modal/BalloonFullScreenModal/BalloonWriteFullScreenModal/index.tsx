import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import titleStyle from '../titleStyle.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Button from '@/components/Buttons/Button';
import Cash from '@/pages/Room_LEGACY/components/Cash';
import Text from '@/components/Text';
import BalloonItemList from './BalloonItemList';
import useBalloonWriteFullScreenModal, { MESSAGE_MAX_LENGTH } from './hooks';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import ToolTip from '@/pages/_shared/ui/ToolTip';
import { useState } from 'react';
import { t } from 'i18next';
interface IBalloonWriteFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  targetRoomId: string;
}
const BalloonWriteFullScreenModal = ({
  targetRoomId,
  onRequestClose,
}: IBalloonWriteFullScreenModal) => {
  const {
    targetNickname,
    targetSelfie,
    message,
    handleChangeMessage,
    handleSendBalloon,
  } = useBalloonWriteFullScreenModal(targetRoomId, onRequestClose);
  const [isShowToolTip, setIsShowToolTip] = useState(false);
  const handleClose = () => {
    onRequestClose();
  };
  const Header = () => {
    return (
      <div className={titleStyle.title}>
        <div className={titleStyle.leftSide}>
          <CustomButton className={titleStyle.btnBack} onClick={handleClose}>
            <Icon name="Top_Arrow_left_M" />
          </CustomButton>
          <span>
            <Text
              locale={{ textId: 'GMY.000050' }}
              defaultValue="풍선 날리기"
            />
          </span>
          <CustomButton
            className={titleStyle.btnInfo}
            onClick={() => {
              setIsShowToolTip(true);
            }}
          >
            <Icon name="Info"></Icon>
          </CustomButton>
          {isShowToolTip ? (
            <ToolTip
              shape='lt'
              showClose={true}
              className={titleStyle.toolTip}
              handleClose={() => {
                setIsShowToolTip(false);
              }}
            >
              <Text
                locale={{ textId: 'GMY.000157' }}
                defaultValue="풍선을 날리면 마이룸에 7일간 무작위로 노출됩니다."
              />
            </ToolTip>
          ) : null}
        </div>
        <div className={titleStyle.rightSide}>
          <Cash />
        </div>
      </div>
    );
  };
  const TargetUser = () => {
    return (
      <div className={style.targetUserWrapper}>
        <Profile size="xxxl" shape="circle-br" src={targetSelfie} />
        <div className={style.targetNicknameWrapper}>
          <span className={style.nickname}>{targetNickname} </span>
          <Text
            locale={{
              textId: 'GMY.000176',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={true}>
      <div className={style.background}>
        <Header />
        <div className={style.body}>
          <TargetUser />
          <BalloonItemList />
          <div className={style.line}></div>
          <div className={style.messageWrapper}>
            <div className={style.messageTitle}>
              <Text locale={{ textId: 'GMY.000060' }} hasTag />
            </div>

            <textarea
              className={style.textArea}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={t('GMY.000061')}
              value={message}
              onChange={handleChangeMessage}
            ></textarea>
          </div>
        </div>
        <Button
          size="full"
          shape="rect"
          onClick={handleSendBalloon}
          disabled={message == ''}
        >
          <Text locale={{ textId: 'GMY.000162' }} />
        </Button>
      </div>
    </Modal>
  );
};
export default BalloonWriteFullScreenModal;
