
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import style from './styles.module.scss';
import Container from '../_shared/layouts/Container';
import Button from '@/components/Buttons/Button';
import useError from './hooks';
import SignInSheet from '../Room_LEGACY/Main/SignInSheet';
import View from '../_shared/layouts/View';

const Error = () => {
  const { errorMsg, redirectData, handleRedirect } = useError();
  return (
    <View disableHeader>
      <Container className={style.container}>
        <div className={style.primaryColor}>
          <Icon name="Allim_Empty2" />
        </div>

        <p>
          <Text
            locale={{
              textId: '죄송합니다.</br>해당 페이지를 찾을 수 없습니다.',
            }}
            hasTag
          />
        </p>
        {errorMsg ? <p className={style.errorCode}>({errorMsg})</p> : ''}

        <Button
          onClick={handleRedirect}
          className={style.btnRedirection}
          size="l"
        >
          <Text locale={{ textId: redirectData.textId }} />
        </Button>
      </Container>
      <SignInSheet />
    </View>
  );
};

export default Error;
