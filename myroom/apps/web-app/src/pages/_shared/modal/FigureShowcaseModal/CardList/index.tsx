import style from './style.module.scss';
import CardItem from '../CardItem';
import InputText from '@/components/Forms/InputText';
import ItemNone from '../ItemNone';
import useFollowItem from '../useFollowItem';
import SearchNone from '../SearchNone';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import useFollowSearchInput from '../useFollowSearchInput';
import { t } from 'i18next';
import Skeleton from '@/components/Skeleton';
import { useEffect } from 'react';

// import SkeletonCore from '@/components/_core/SkeletonCore';
interface ICardList {
  isActive: boolean;
  isMe: boolean;
  list?: { _id: string }[];
  isLoading: boolean;
  profileId: string;
}

const CardList = ({
  isActive,
  isMe,
  list,
  isLoading,
  profileId,
}: ICardList) => {
  const {
    searchName,
    inputValue,
    handleChangeInput,
    handleDeleteInput,
    handleInputKeyDown,
    inViewRefSearchFollowing,
    isLoadingSearchFollowing,
    searchFollowingList,
  } = useFollowSearchInput(profileId);
  const { inViewRefShowcaseCard } = useFollowItem(profileId);
  const hasItems = list && list.length > 0;

  //수정 주의
  // height={188}를 넣으면 401에러뜸(?).
  const CardItemSkeleton = () => {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} isLoading={true}></Skeleton>
        ))}
      </>
    );
  };

  if (!isActive) return <></>;

  return (
    <div className={style.figureShowcaseCardListWrapper}>
      {!(searchName && isLoadingSearchFollowing) && !isLoading && !hasItems && (
        <ItemNone isMe={isMe} />
      )}
      {(isLoading || hasItems) && (
        <div className={style.inputWrapper}>
          <InputText
            type={'text'}
            placeholder={t('GCM.000005')} //검색
            value={inputValue}
            onChange={handleChangeInput}
            onKeyDown={handleInputKeyDown}
          />
          {inputValue && (
            <CircleButton
              shape="circle"
              size="xxs"
              className={style.btnDeleteInput}
              onClick={handleDeleteInput}
            >
              <Icon name="Close_One_S" />
            </CircleButton>
          )}
        </div>
      )}
      {searchName ? (
        <div className={style.figureCardItemGridWrapper}>
          {searchFollowingList && searchFollowingList.length > 0 ? (
            searchFollowingList.map((item, index) => (
              <CardItem
                key={`${item._id}-${index}`}
                isMe={isMe}
                profileId={item._id}
              />
            ))
          ) : (
            <SearchNone />
          )}
          <div className={style.inView} ref={inViewRefSearchFollowing}></div>
        </div>
      ) : (
        <div className={style.figureCardItemGridWrapper}>
          {isLoading && <CardItemSkeleton />}
          {hasItems &&
            list?.map((item, index) => (
              <CardItem
                key={`${item._id}-${index}`}
                isMe={isMe}
                profileId={item._id}
              />
            ))}
          <div className={style.inView} ref={inViewRefShowcaseCard}></div>
        </div>
      )}
    </div>
  );
};

export default CardList;
