import Text from '@/components/Text';
import InputText from '@/components/Forms/InputText';
import style from './styles.module.scss';
import useProfileName from './hooks';
import { t } from 'i18next';
import Icon from '@/components/Icon';
import classnames from 'classnames';

const URL_Prefix = 'myping.co/rooms/';
const ICON_VALID = 'Success';
const ICON_INVALID = 'Erroe';

type ProfileNameProps = {
  createdProfileName: string;
};
const ProfileName = ({ createdProfileName }: ProfileNameProps) => {
  const { profileName, profileNameInvalidMsg, handleChangeProfileName } =
    useProfileName();

  const printProfileNameValidMark = () => {
    if (
      createdProfileName == '' &&
      profileName == '' &&
      profileNameInvalidMsg == ''
    )
      return '';

    let iconName = ICON_VALID;
    let colorCode = true;
    if (profileNameInvalidMsg != '') {
      iconName = ICON_INVALID;
      colorCode = false;
    }

    return (
      <div
        className={classnames(style.profileNameValidMark, {
          [`${style['success']}`]: colorCode,
        })}
      >
        <Icon name={iconName} />
      </div>
    );
  };
  return (
    <div className={style.profileNameWrapper}>
      <div className={style.speechBubbleWrapper}>
        <div className={style.speechBubbleBG}>
          <Text locale={{ textId: 'GSU.000015' }} />{' '}
          {/* GSU000015 아이디는 여러분의 마이룸 주소입니다. */}
        </div>
      </div>

      <div
        className={`${style.profileNameInputWrapper} ${
          createdProfileName == '' &&
          profileName == '' &&
          profileNameInvalidMsg == ''
            ? style.empty
            : profileNameInvalidMsg == ''
            ? style.valid
            : style.invalid
        }`}
      >
        <Text text={URL_Prefix} />
        <InputText
          className={style.profileNameInput}
          type="text"
          onChange={handleChangeProfileName}
          //ref={null}
          placeholder={t('GSU.000016')}
          value={createdProfileName == '' ? profileName : createdProfileName}
          readOnly={createdProfileName != ''}
        />
        {printProfileNameValidMark()}
      </div>
      {profileNameInvalidMsg != '' ? (
        <div className={style.profileNameWarningWrapper}>
          <Icon name="check" />
          <Text text={profileNameInvalidMsg} />
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
export default ProfileName;
