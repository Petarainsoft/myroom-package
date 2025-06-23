import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import ProfileThumnail from '@/pages/_shared/ui/Profiles/Profile';
import useProfileModifyFullScreenModal from './hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import Button from '@/components/Buttons/Button';
import InputText from '@/components/Forms/InputText';
import React, {
  ChangeEventHandler,
  HTMLAttributes,
  MouseEventHandler,
  useMemo,
  useState,
} from 'react';
import Text from '@/components/Text';

interface IProfileModifyFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  profileId: string;
}
const ProfileModifyFullScreenModal = ({
  profileId,
  onRequestClose,
}: IProfileModifyFullScreenModal) => {
  const {
    selfiePath,
    isImageSelfie,
    nickname,
    myRoomTitle,
    canSave,
    userName,
    userDesc,
    nicknameFieldRef,
    myRoomTitleFieldRef,
    selfieInputRef,
    handleSelectAvatarSelfie,
    handleSelectImageSelfieFile,
    handleClearNicknameField,
    handleClearMyRoomTitleField,
    handleOnChangeNicknameField,
    handleOnChangeMyRoomTitleField,
    handleOnChangeUserDescField,
    handleCopyText,
    handleSubmit,
  } = useProfileModifyFullScreenModal(profileId);
  const [isFocusedNickname, setIsFocusedNickname] = useState<boolean>(false);
  const [isFocusedMyRoomName, setIsFocusedMyRoomName] =
    useState<boolean>(false);

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
        <div className={style.headerText}>프로필 편집</div>
      </div>
    );
  };
  const SelfieArea = useMemo(
    () => () => {
      return (
        <div className={style.selfieWrapper}>
          <ProfileThumnail size="xxxl" src={selfiePath} shape="circle-br" />
          <div className={style.btnWrapper}>
            <label className={style.btnSelfieSetting}>
              <Icon className={style.btnicon} name="ImgUP_Default_S" />
              <div className={style.btnText}>사진</div>
              <input
                type="file"
                id="fileInput"
                accept=".jpg, .jpeg, .png"
                ref={selfieInputRef}
                onChange={handleSelectImageSelfieFile}
                style={{ display: 'none' }}
              />
            </label>
            {isImageSelfie ? (
              <CustomButton
                className={style.btnSelfieSetting}
                onClick={handleSelectAvatarSelfie}
              >
                <Icon className={style.btnicon} name="Profile_S" />
                <div className={style.btnText}>아바타</div>
              </CustomButton>
            ) : null}
          </div>
        </div>
      );
    },
    [selfiePath, isImageSelfie, selfieInputRef],
  );
  const InputFieldWrapper = useMemo(
    () =>
      ({
        title,
        handleClearBtn,
        showClearBtn = false,
        children,
      }: {
        title: string;
        handleClearBtn: MouseEventHandler<HTMLButtonElement>;
        showClearBtn?: boolean;
      } & HTMLAttributes<HTMLDivElement>): React.ReactElement => {
        return (
          <div className={style.inputWrapper}>
            <div className={style.inputTitle}>{title}</div>
            <div className={style.inputFieldWrapper}>
              {children}
              <CircleButton
                size="xxs"
                onClick={handleClearBtn}
                className={`${style.btnInputClear} ${
                  showClearBtn ? style.show : style.hide
                }`}
              >
                <Icon name="Close_Bottom_S" />
              </CircleButton>
            </div>
          </div>
        );
      },
    [],
  );
  const ReadAndCopyOnlyTextField = ({
    title,
    value,
  }: {
    title: string;
    value: string;
  }) => {
    return (
      <div className={style.inputWrapper}>
        <div className={style.inputTitle}>{title}</div>
        <div className={`${style.inputFieldWrapper} ${style.readonly}`}>
          <InputText
            className={style.inputField}
            type="text"
            value={value}
            readOnly
          />
          <CircleButton
            size="xs"
            shape="none"
            onClick={() => {
              handleCopyText(value);
            }}
          >
            <Icon name="Copy_M" />
          </CircleButton>
        </div>
      </div>
    );
  };
  const TextArea = useMemo(
    () =>
      ({
        title,
        value,
        placeHolder,
        handleChangeValue,
      }: {
        title: string;
        value: string;
        placeHolder: string;
        handleChangeValue: ChangeEventHandler<HTMLTextAreaElement>;
      }) => {
        return (
          <div className={style.inputWrapper}>
            <div className={style.inputTitle}>{title}</div>
            <textarea
              value={value}
              placeholder={placeHolder}
              onChange={handleChangeValue}
            />
          </div>
        );
      },
    [],
  );
  const Description = ({
    textId,
    icon,
    textColor = '',
  }: {
    textId: string;
    icon: string;
    textColor?: string;
  }) => {
    return (
      <div className={style.descriptionWrapper}>
        <Icon name={icon} className={style.icon} />
        <div className={`${style.description} ${style[textColor]}`}>
          <Text locale={{ textId: textId }} />
        </div>
      </div>
    );
  };
  const MarginBox = ({ size }: { size: number }) => {
    return <div className={style[`height${size}`]}></div>;
  };
  return (
    <Modal isOpen={true}>
      <div className={style.profileSettingWrapper}>
        <Header />
        <div className={style.body}>
          <SelfieArea />
          <div className={style.formWrapper}>
            <InputFieldWrapper
              title={'닉네임'}
              handleClearBtn={handleClearNicknameField}
              showClearBtn={isFocusedNickname && nickname.length > 0}
            >
              <InputText
                className={style.inputField}
                type="text"
                value={nickname}
                ref={nicknameFieldRef}
                placeholder={'닉네임을 입력해주세요.'}
                onChange={handleOnChangeNicknameField}
                onFocus={() => {
                  setIsFocusedNickname(true);
                }}
                onBlur={() => {
                  setIsFocusedNickname(false);
                }}
              />
            </InputFieldWrapper>

            <MarginBox size={30} />
            <ReadAndCopyOnlyTextField
              title={'프로필 ID'}
              value={userName ?? ''}
            />
            <Description
              textId="ID는 처음 설정한 후에는 변경할 수 없습니다."
              icon="check"
            />
            <MarginBox size={30} />
            <TextArea
              title="자기소개(선택)"
              value={userDesc ?? ''}
              placeHolder="자기소개를 입력해주세요."
              handleChangeValue={handleOnChangeUserDescField}
            />
            <MarginBox size={30} />
            <InputFieldWrapper
              title={'마이룸 이름'}
              handleClearBtn={handleClearMyRoomTitleField}
              showClearBtn={isFocusedMyRoomName && myRoomTitle.length > 0}
            >
              <InputText
                className={style.inputField}
                type="text"
                value={myRoomTitle}
                ref={myRoomTitleFieldRef}
                placeholder={'마이룸 이름을 입력해주세요.'}
                onChange={handleOnChangeMyRoomTitleField}
                onFocus={() => {
                  setIsFocusedMyRoomName(true);
                }}
                onBlur={() => {
                  setIsFocusedMyRoomName(false);
                }}
              />
            </InputFieldWrapper>
          </div>
        </div>
        <Button
          className={style.btnSubmit}
          shape="rect"
          size="full"
          disabled={!canSave}
          onClick={handleSubmit}
        >
          완료
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileModifyFullScreenModal;
