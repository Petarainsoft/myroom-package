import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import ProfileName from './ProfileName';
import RoomPresetViewer from './RoomPresetViewer';
import style from './styles.module.scss';
import useSignupRoom from './hooks';
import { getLocaleText } from '@/common/utils/text';
import View from '@/pages/_shared/layouts/View';

const Room = () => {
  const {
    profileName,
    createdProfileName,
    isProfileNameInvalid,
    roomColor,
    handleClickCreateRoom,
    handleClickBack,
  } = useSignupRoom();

  return (
    <View
      disableNavigation
      headerOptions={{
      startArea: <>{getLocaleText('GSU.000014')}</>,
      closeOptions: {
        icon: 'arrow',
        onClick: handleClickBack
    } }}>
      <div className={`${style.background} ${style.gridPattern}`}>
        <div style={{ backgroundColor: roomColor }}>
          <ProfileName createdProfileName={createdProfileName} />
          <RoomPresetViewer />
        </div>
        <div className={style.dummyButtonArea}></div>
        <Button
          className={style.btnCreateRoom}
          shape="rect"
          size="full"
          onClick={handleClickCreateRoom}
          disabled={
            (createdProfileName == '' && profileName == '') ||
            isProfileNameInvalid
          }
        >
          <Text locale={{ textId: 'GCM.000002' }} />
        </Button>
      </div>
    </View>
  );
};

export default Room;
