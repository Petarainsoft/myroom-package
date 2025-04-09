import { Modal, ModalProps } from '@/components/_core/ModalCore';
import './style.scss';
import Header from './Header';
import { t } from 'i18next';
import FigureShowcaseContent from './FigureShowcaseContent';
import { logger } from '@/common/utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import useMe from '@/common/hooks/use-me';
import useProfileAPI from '@/apis/User/Profile';
import View from '../../layouts/View';

interface IFigureShowcaseModal extends Omit<ModalProps, 'onRequestClose'> {
  profileId?: string;
  isMe?: boolean;
  isPage: boolean;
}

const FigureShowcaseModal = ({
  profileId,
  isMe,
  isPage,
  onRequestClose,
}: IFigureShowcaseModal) => {
  const { fetchProfile } = useProfileAPI();

  const navigate = useNavigate();
  const { meProfileId } = useMe();
  const { id } = useParams();
  const { data: profileData } = fetchProfile(profileId ?? id!);
  const roomOwnerNickName = profileData?.data.option.nick;
  const handleGoBack = () => {
    logger.log('goBack figureShowcase');
    if (!isPage) {
      onRequestClose();
      return;
    }
    // const path = window.location.pathname;
    navigate(-1);
    onRequestClose();
  };

  return (
    <Modal isOpen={true} className={'figureShowcaseModalWrapper'}>
      <View
        fixed
        disableNavigation={false}
        headerOptions={{
          startArea: <Header nick={roomOwnerNickName!} headerTitle={t('GPF.000010')} />,
          closeOptions: {
            onClick: handleGoBack,
            icon: "arrow"
          }
        }}>
        {isPage ? (
          <FigureShowcaseContent profileId={id!} isMe={id === meProfileId} />
        ) : (
          <FigureShowcaseContent profileId={profileId!} isMe={isMe!} />
        )}
      </View>
    </Modal>
  );
};

export default FigureShowcaseModal;
