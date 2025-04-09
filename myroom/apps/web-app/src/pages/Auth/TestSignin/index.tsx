import Button from '@/components/Buttons/Button';
// import CustomButton from '@/components/Buttons/CustomButton';
import InputText from '@/components/Forms/InputText';
import Container from '@/pages/_shared/layouts/Container';
import useTestSignin from './hooks';
import Text from '@/components/Text';
// import CheckBox from '@/components/Forms/CheckBox';
import style from './style.module.scss';
import View from '@/pages/_shared/layouts/View';

const TestSignin = () => {
  const {
    id,
    password,
    // isSwagger,
    message,
    handleChangeId,
    handleChangePassword,
    handleClickSignin,
    handleClickSignup,
    handleClickBack
  } = useTestSignin();

  return (
    <View
      disableNavigation
      headerOptions={{
        startArea: <Text text={'테스트 로그인'} />,
        closeOptions: {
          icon:"arrow",
          onClick: handleClickBack
        }
      }}>
      <Container className={style['test-signin-wrap']}>
        <Text text="ID" />
        <InputText
          type={'text'}
          onChange={handleChangeId}
          value={id}
        />
        <br />
        <Text text="Password" />
        <InputText
          type={'password'}
          onChange={handleChangePassword}
          value={password}
        />
        <div className={style['msg-box']}>
          {message && <Text text={message} />}
        </div>
        <div className={style['btn-wrap']}>
          <Button size="l" variant="secondary" onClick={handleClickSignup}>
            <Text text="Signup" />
          </Button>
          <Button size="l" variant="primary" onClick={handleClickSignin}>
            <Text text="Signin" />
          </Button>
        </div>
      </Container>
    </View>
  );
};

export default TestSignin;
