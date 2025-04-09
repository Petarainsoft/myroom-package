import styles from './styles.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import CircleButton from '@/components/Buttons/CircleButton';
import useSearchHome from './hooks';
import Icon from '@/components/Icon';

const Home = () => {
  const {
    recentSearchList,
    handleClickRecentSearch,
    handleClickRemoveRecentSearch,
  } = useSearchHome();

  return (
    <div className={styles['container']}>
      <div className={styles['recent-wrap']}>
        {recentSearchList.map((item: string) => (
          <div
            key={`recent-${item}`}
            className={styles['recent-box']}
            onClick={(e) => {
              e.stopPropagation();
              handleClickRecentSearch(item);
            }}
          >
            <CustomButton className={styles['text']}>{item}</CustomButton>
            <CircleButton
              shape="none"
              size={'xxs'}
              onClick={(e) => {
                e.stopPropagation();
                handleClickRemoveRecentSearch(item);
              }}
            >
              <Icon name="Close_S" />
            </CircleButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
