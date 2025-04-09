import Button from '@/components/Buttons/Button';
import useTerms from './hooks';
import style from './styles.module.scss';
import Container from '@/pages/_shared/layouts/Container';
import Text from '@/components/Text';
import CustomButton from '@/components/Buttons/CustomButton';
import { TermKind, TermData } from './hooks';
import IconCheckBox from '@/components/Forms/CheckBox/IconCheckBox';
import View from '@/pages/_shared/layouts/View';
const Terms = () => {
  const {
    termDataList,
    checkFlag,
    ESSENTIAL_FLAG,
    handleClickAllAgree,
    handleCheckboxChanged,
    handleClickDetailView,
    handleClickNext,
  } = useTerms();

  const TermItem = ({ data }: { data: TermData }): React.ReactElement => {
    return (
      <li>
        <IconCheckBox
          className={style.checkBox}
          onChange={handleCheckboxChanged}
          checked={(checkFlag & data.kind) == data.kind}
          value={data.kind}
        >
          <span className={style.checkBoxChild}>
            <Text locale={{ textId: data.titleTextId }} hasTag={true} />
          </span>
        </IconCheckBox>
        {data.detail ? (
          <CustomButton
            onClick={handleClickDetailView}
            value={data.kind}
            className={style.termDetail}
          >
            <Text locale={{ textId: 'GSU.000011' }} />
          </CustomButton>
        ) : (
          ''
        )}
      </li>
    );
  };
  return (
    <div className={style.background}>
      <View disableNavigation disableHeader>
          <Container>
            <div className={style.headLineWrap}>
              <div className={style.headLine}>
                <Text
                  locale={{ textId: 'GSU.000028' }}
                  defaultValue="이용약관을 확인해 주세요."
                />
              </div>
              <div className={style.subHeadLine}>
                <div className={style.dot}></div>
                <Text
                  locale={{ textId: 'GSU.000029' }}
                  defaultValue="선택 항목에 대한 동의를 거부하시는 경우에도 서비스는 이용이 가능합니다."
                />
              </div>
            </div>

            <Container
              className={`${style.roundingBox} ${
                (checkFlag & TermKind.ALL_CHECKED) == TermKind.ALL_CHECKED
                  ? style.borderBlack
                  : ''
              }`}
            >
              <IconCheckBox
                className={style.allCheckBox}
                onChange={handleClickAllAgree}
                checked={
                  (checkFlag & TermKind.ALL_CHECKED) == TermKind.ALL_CHECKED
                }
                value={TermKind.ALL_CHECKED}
              >
                <span className={style.checkBoxChild}>
                  <Text locale={{ textId: 'GSU.000009' }} />
                </span>
              </IconCheckBox>
            </Container>
            <Container className={style.roundingBox}>
              <ul>
                {termDataList.map((data) => (
                  <TermItem key={data.kind} data={data} />
                ))}
              </ul>
            </Container>
          </Container>
          <Button
            shape="rect"
            size="full"
            className={style.nextButton}
            onClick={handleClickNext}
            disabled={(checkFlag & ESSENTIAL_FLAG) != ESSENTIAL_FLAG}
          >
            <Text locale={{ textId: 'GCM.000001' }} />
          </Button>
      </View>
    </div>
  );
};
export default Terms;
