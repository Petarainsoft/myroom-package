import useSignin from './hooks';
import CustomButton from '@/components/Buttons/CustomButton';
import Container from '@/pages/_shared/layouts/Container';
import Text from '@/components/Text';
import style from './style.module.scss';
import Icon from '@/components/Icon';
import View from '@/pages/_shared/layouts/View';

type SigninButtonProps = {
  textId: string;
  provider: 'kakao' | 'google' | 'test';
  checked?: boolean;
  onClick: () => void;
};
const SigninButton = ({
  textId,
  provider,
  onClick,
  // checked = false,
}: SigninButtonProps) => {
  return (
    <CustomButton
      className={`${style['btn-signin']} ${style[provider]}`}
      onClick={onClick}
    >
      <div className={style['btn-icon-wrap']}>
        <Icon name={provider} />
      </div>
      <div>
        <Text locale={{ textId }} />
      </div>
      <div className={style['btn-icon-wrap']}></div>
    </CustomButton>
  );
};

const Signin = () => {
  const {
    isSignin,
    handleClickSignin,
    handleClickTestSignin,
    handleClickToggleSign,
    handleClickBack,
  } = useSignin();

  return (
    <View disableNavigation headerOptions={{
      startArea:<Text text="PingPong" />,
      closeOptions: {
          icon:'arrow',
          onClick:handleClickBack
        }
      }}>
      <Container className={style['main']}>
        <div className={style['landing']}>
          <Text
            locale={{ textId: isSignin ? 'GSU.000001' : 'GSU.000005' }}
            hasTag
          />
        </div>
      </Container>
      <Container className={style['btn-container']}>
        <SigninButton
          textId={isSignin ? 'GSU.000002' : 'GSU.000006'}
          provider="kakao"
          onClick={() => handleClickSignin('Kakao')}
          checked
        />
        <SigninButton
          textId={isSignin ? 'GSU.000003' : 'GSU.000007'}
          provider="google"
          onClick={() => handleClickSignin('Google')}
        />
        <SigninButton
          textId="테스트로 로그인하기"
          provider="test"
          onClick={handleClickTestSignin}
        />
        <CustomButton 
            onClick={handleClickToggleSign}
            className={style['toggleSignButton']}
            >
            <span>
              <Text
                locale={{
                  textId: isSignin ? 'GSU.000004' : 'GSU.000008',
                }}
                hasTag
              />  
            </span>
            <div className={style['toggleSignArrow']}> </div>
          </CustomButton>
        
      </Container>
    </View>
  );
};

export default Signin;
