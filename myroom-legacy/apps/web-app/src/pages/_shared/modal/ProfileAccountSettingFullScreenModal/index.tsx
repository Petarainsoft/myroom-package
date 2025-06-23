import { Modal, ModalProps } from '@/components/_core/ModalCore';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';

import { ReactElement } from 'react';
import Text from '@/components/Text';
import useProfileAccountSettingFullScreenModal from './hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import Button from '@/components/Buttons/Button';

interface IProfileAccountSettingFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  profileId: string;
}
const ProfileAccountSettingFullScreenModal = ({
  onRequestClose,
}: IProfileAccountSettingFullScreenModal) => {
  const {
    selectedLanguage,
    selectedFigureSetting,
    selectedNotificationSetting,
    handleLogout,
    handleLogoutAllBrowser,
    handleShowFigureInfo,
    handleNotification,
    handleLanguage,
    handleServiceTerms,
    handlePersonalTerms,
    handleWithdraw,
    handleOnClose,
  } = useProfileAccountSettingFullScreenModal(onRequestClose);

  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton size="xs" shape="none" onClick={handleOnClose}>
          <Icon name="Top_Arrow_left_M" />
        </CircleButton>
        <div className={style.headerText}>설정 및 계정</div>
      </div>
    );
  };
  const SectionWrapper = ({
    titleId,
    children,
  }: {
    titleId: string;
    children: ReactElement;
  }) => {
    return (
      <div className={style.sectionWrapper}>
        {titleId !== '' ? (
          <div className={style.title}>
            <Text locale={{ textId: titleId }} />
          </div>
        ) : null}

        {children}
      </div>
    );
  };
  const SectionItem = ({
    titleId,
    selectedValue,
    icon,
    handleClick,
    children,
  }: {
    titleId: string;
    selectedValue: string;
    icon: string;
    handleClick: () => void;
    children?: ReactElement;
  }) => {
    return (
      <CustomButton className={style.sectionItem} onClick={handleClick}>
        <div className={style.title}>
          <Text locale={{ textId: titleId }} />
        </div>
        <div className={style.rightSide}>
          {selectedValue !== '' ? (
            <div className={style.selectedValue}>
              <Text text={selectedValue} />
            </div>
          ) : null}

          <Icon name={icon} />
        </div>
        <div>{children}</div>
      </CustomButton>
    );
  };
  const SplitSectionItem = () => {
    return <div className={style.splitSectionItem}></div>;
  };
  const SplitSection = () => {
    return <div className={style.splitSection}></div>;
  };

  return (
    <Modal isOpen={true}>
      <div className={style.accountSettingsWrapper}>
        <Header />
        <div className={style.body}>
          <SectionWrapper titleId="내 계정">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="로그인 채널"
                selectedValue="카카오"
                icon="Arrow_Right_SS"
                handleClick={() => {}}
              />
              <Button shape="capsule" size="l" className={style.btnLogout} onClick={handleLogout}>
                로그아웃
              </Button>
              <SplitSectionItem />
              <SectionItem
                titleId="모든 브라우저에서 로그아웃"
                selectedValue=""
                icon="Arrow_Right_SS"
                handleClick={handleLogoutAllBrowser}
              />
            </div>
          </SectionWrapper>
          <SplitSection />
          <SectionWrapper titleId="마이룸">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="피규어/아이템 정보 표시"
                selectedValue={selectedFigureSetting}
                icon="Arrow_Right_SS"
                handleClick={handleShowFigureInfo}
              />
            </div>
          </SectionWrapper>
          <SplitSection />
          <SectionWrapper titleId="알림">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="알림 수신"
                selectedValue={selectedNotificationSetting}
                icon="Arrow_Right_SS"
                handleClick={handleNotification}
              />
            </div>
          </SectionWrapper>
          <SplitSection />
          <SectionWrapper titleId="언어">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="표시 언어"
                selectedValue={selectedLanguage}
                icon="Arrow_Right_SS"
                handleClick={handleLanguage}
              />
            </div>
          </SectionWrapper>
          <SplitSection />
          <SectionWrapper titleId="정보">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="이용 약관"
                selectedValue=""
                icon="Arrow_Right_SS"
                handleClick={handleServiceTerms}
              />
              <SplitSectionItem />
              <SectionItem
                titleId="개인정보처리방침"
                selectedValue=""
                icon="Arrow_Right_SS"
                handleClick={handlePersonalTerms}
              />
            </div>
          </SectionWrapper>
          <SplitSection />
          <SectionWrapper titleId="">
            <div className={style.sectionItemWrapper}>
              <SectionItem
                titleId="서비스탈퇴"
                selectedValue=""
                icon="Arrow_Right_SS"
                handleClick={handleWithdraw}
              />
            </div>
          </SectionWrapper>
        </div>
      </div>
    </Modal>
  );
};
export default ProfileAccountSettingFullScreenModal;
