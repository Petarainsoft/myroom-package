//import {useEffect} from 'react'
import { useAtom } from 'jotai';
import { uiOnBoardingAtom } from '@/common/stores';
import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import style from './styles.module.scss';
import useUserAPI from '@/apis/User/User';
import CustomButton from '@/components/Buttons/CustomButton';

const OnBoardingUI = () => {
  const [uiOnBoarding, setUIOnBoarding] = useAtom(uiOnBoardingAtom);
  const profileList = useUserAPI().fetchUsersMeProfiles(1, 1);
  const userName = profileList.data?.list?.at(0)?.option.nick ?? '';

  const handleClose = () => {
    setUIOnBoarding(false);
  };
  //for test --//
  // useEffect (()=>{
  //   setUIOnBoarding(true);
  // },[]);

  type GuideProps = {
    iconName: string;
    titleId: string;
    descId: string;
  };
  const Guide = ({
    iconName,
    titleId,
    descId,
  }: GuideProps): React.ReactElement => {
    return (
      <li className={style.guideWrapper}>
        <div className={style.guideIcon}>
          <Icon name={iconName} />
        </div>
        <div className={style.guideTextWrapper}>
          <span className={style.title}>
            <Text locale={{ textId: titleId }} />
          </span>
          <span className={style.desc}>
            <Text locale={{ textId: descId }} />
          </span>
        </div>
      </li>
    );
  };

  return uiOnBoarding ? (
    <OffCanvas
      isOpen={uiOnBoarding}
      onClose={handleClose}
      initialSnap={0}
      disableDrag={true}
      headerOptions={{
        disableClose: true,
        customElement: (
          <div className={style.welcome}>
            <div className={style.userNicknameWrapper}>
              <span className={style.highlight}>{userName}</span>
              <Text locale={{ textId: 'GSU.000022' }} />
            </div>
            <Text locale={{ textId: 'GSU.000023' }} />
          </div>
        ),
      }}
    // backdropProps={{onTap:handleClose}}
    >
      <div className = {style.bottomWrapper}>
        <ul className={style.guideListWrapper}>
          <Guide
            iconName="Onboarding_Myroom"
            titleId="GSU.000024"
            descId="GSU.000025"
          />
          <Guide
            iconName="Onboarding_Avatar"
            titleId="GSU.000026"
            descId="GSU.000027"
          />
        </ul>
        <CustomButton
          className={style.okButton}
          onClick={handleClose}
        >
          <Text locale={{ textId: 'GCM.000003' }} />
        </CustomButton>
      </div>
      
    </OffCanvas>
  ) : (
    <></>
  );
};
export default OnBoardingUI;
