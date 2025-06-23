import React, { useMemo } from 'react';
import { nFormatter } from '@/common/utils/string-format';
import { logger } from '@/common/utils/logger';
import { Modal  } from '@/components/_core/ModalCore';
import { ProfileCard } from "@/pages/_shared/ui/Cards/ProfileCard";
import InfiniteLoader from "react-window-infinite-loader";
import CircleButton from '@/components/Buttons/CircleButton';
import Button from '@/components/Buttons/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import InputText from '@/components/Forms/InputText';
import Form from "@/components/Forms/Form";
import { t } from 'i18next';
import View from '../../layouts/View';
import useFollowModal from './hooks';
import { IFollowFullScreenModal, UserElementProps } from './type';
import { FixedSizeList } from 'react-window';
import Container from '../../layouts/Container';
import style from './style.module.scss';

const FollowFullScreenModal = ({
  isMine,
  profileId,
  selectedMenu,
  onRequestClose,
}: IFollowFullScreenModal) => {

  const {
    searchText,
    selectedTab,
    setTab,
    desc,
    btnText,
    followingList, 
    setFollowingList,
    followerList, 
    setFollowerList,
    handleChangeSearchText,
    handleClickResetSearchText,
    handleTab,
    handleClose,
    handleEmptyAction,
    handleRefresh,
    recommendFollowerData,
    searchFollowerData,
    fetchNextPageSearchFollower,
    searchFollowingData,
    fetchNextPageSearchFollowing,
    followerData,
    isLoadingFollowerData,
    fetchNextPageFollowerData,
    followingData,
    isLoadingFollowingData,
    fetchNextPageFollowingData,
    totalCount,
    contentsWrapRef,
    width, height, searchResult
  } = useFollowModal({
    isMine,
    profileId,
    selectedMenu,
    onRequestClose,
  });
  

  const Tabs = (): React.ReactElement => {
    const followerNum = followerData ? followerData.pages[0]!.list.length : 0;
    const followingNum = followingData ? followingData.pages[0]!.list.length : 0;
    return (
      <div className={style.tabList}>
        <div onClick={handleTab('follower')} className={`${style.tab} ${selectedTab === 'follower' ? style.active : ''}`}>
          <Text locale={{ textId: 'GPF.000003', values: { 0: nFormatter(followerNum) } }}/>
        </div>
        <div onClick={handleTab('following')} className={`${style.tab} ${selectedTab === 'following' ? style.active : ''}`}>
          <Text locale={{ textId: 'GPF.000004', values: { 0: nFormatter(followingNum) } }}/>
        </div>
        <div onClick={handleTab('recommend')} className={`${style.tab} ${selectedTab === 'recommend' ? style.active : ''}`}>
          <Text locale={{ textId: 'GPF.000005'}}  />
        </div>
      </div>
    );
  }

  const Search = useMemo((): React.ReactElement => {
    if(selectedTab === 'recommend') return <></>;
    logger.log('TEST ', searchText)

    return <div className={style.searchContainer}>
            <div className={style['search-wrap']}>
              <Form onSubmit={() => {}}>
                <InputText 
                  variant={'default'} 
                  type={"text"} 
                  onChange={handleChangeSearchText} 
                  value={searchText} 
                  placeholder={t('GCM.000005')} 
                />
                <CircleButton className={style['reset']} onClick={handleClickResetSearchText} size={"s"}>
                  <Icon name="Close_S" />
                </CircleButton>
              </Form>
          </div>
        </div>
  },[searchText, selectedTab])

  const Empty = (): React.ReactElement => {
    return (
      <div className={style.emptyContainer}>
        <div className={style.empty}>
          <div className={style['emptyIcon']}>
            <Icon name={`Allim_Empty1`} />
          </div>
          <div className={style.emptyText}>
            <Text text={desc} />
          </div>
          {btnText !== '' && 
            <Button onClick={handleEmptyAction} size='l' className={style.emptyBtn} >
              <div className={style.emptyBtnElement}>
                <Icon name={`Reset_M`} />
                <Text text={btnText} /> 
              </div>
            </Button>
          }
        </div>
      </div>
    )
  }

  const UserElement: React.FC<UserElementProps> = ({ profile }): React.ReactElement => {
    return <ProfileCard profileId={profile._id} disableDesc={false} />
  };

  const UserList = useMemo((): React.ReactElement[] | React.ReactElement => {

    /** todo : 기본 팔로우/팔로잉, 검색 팔로우/팔로잉 모두 infinite 되도록 변경 (현재 검색만) */
    
    if(selectedTab === 'follower') {
      
      if (totalCount > 0) {
        return <React.Fragment>
        <div className={style['container']} ref={contentsWrapRef}>
          <InfiniteLoader itemCount={searchResult?.length} isItemLoaded={(index) => { return searchResult.length < index;  }} loadMoreItems={() => { fetchNextPageSearchFollower()}} >
            {({ onItemsRendered, ref }) => <FixedSizeList onItemsRendered={onItemsRendered} ref={ref}  height={height}
            itemCount={searchResult?.length}
            itemSize={74}
            width={width}
          >
              {({ index, style }: any) => {
                  return searchResult && searchResult.length > index && <div style={style}><ProfileCard profileId={searchResult[index]._id} disableDesc /></div>
              }}    
            </FixedSizeList>}
          </InfiniteLoader>
        </div>
      </React.Fragment>
      }
      else {
        return <Empty />
      }

    } else if (selectedTab === 'following') {

      if (totalCount > 0) {
        return <React.Fragment>
        <div className={style['container']} ref={contentsWrapRef}>
          <InfiniteLoader itemCount={searchResult?.length} isItemLoaded={(index) => { return searchResult.length < index;  }} loadMoreItems={() => { fetchNextPageSearchFollowing()}} >
            {({ onItemsRendered, ref }) => <FixedSizeList onItemsRendered={onItemsRendered} ref={ref}  height={height}
            itemCount={searchResult?.length}
            itemSize={74}
            width={width}
            className={style['scroll-box']}
          >
              {({ index, style }: any) => {
                  return searchResult && searchResult.length > index && <div style={style}><ProfileCard profileId={searchResult[index]._id} disableDesc /></div>
              }}    
            </FixedSizeList>}
          </InfiniteLoader>
        </div>
        </React.Fragment>
      } else {
        return <Empty />
      }

    } else {
      logger.log('recommend isMine', isMine);

      if(!recommendFollowerData || recommendFollowerData.list.length === 0) {
        return <Empty />
      } else {
        return <div className={style['userList']}>
          {recommendFollowerData.list.map((_id: any) => 
            <UserElement profile={_id}/>
          )}
        </div> 
      }
      
    }
  }, [selectedTab, followerList, followingList, recommendFollowerData])


  React.useEffect(() => {
    setTab(selectedMenu);
  }, []);

  React.useEffect(() => {
    if(isLoadingFollowingData) return;
    setFollowingList(followingData);
  }, [followingData]);
  
  React.useEffect(() => {
    if(isLoadingFollowerData) return;
    setFollowerList(followerData);
  }, [followerData]);

  React.useEffect(() => {
    logger.log('searchText ', searchText);
    const length = searchText.length;
    if (selectedTab === 'follower') {
      if(length === 0) {
        setFollowerList(followerData);
      } else if(length < 2) {
        setFollowerList(undefined);
      } else {
        logger.log('searchText1 ', searchFollowerData)
        if(!searchFollowerData) setFollowerList(undefined);
        else setFollowerList(searchFollowerData)
      }
      
    } else if(selectedTab === 'following') {
      if(length === 0) {
        setFollowingList(followingData);
      } else if(length < 2) {
        setFollowingList(undefined);
      } else {
        logger.log('searchText1 ', searchFollowingData)
        if(!searchFollowingData) setFollowingList(undefined);
        else setFollowingList(searchFollowingData)
      }
    }


  }, [searchText, searchFollowingData, searchFollowerData]);

  return (
    <Modal isOpen={true} className={style.followModalWrapper}>
      <View 
          fixed className={style['wrap']}
          headerOptions={{
            closeOptions: { icon: "arrow", onClick: handleClose, }
          }
        }>
        <div className={style.followContainer}>
          <Tabs />
          <div className={style.content}>
            {Search}
            {/* <div className={style.userList} ref={contentsWrapRef}> */}
              <Container className={style['wrap']} ref={contentsWrapRef}>
                {UserList}
              </Container>
              {/* <Container className={style['wrap']} ref={contentsWrapRef}>
                {totalCount > 0? <React.Fragment>
                  <div className={style['container']} ref={contentsWrapRef}>
                    <InfiniteLoader itemCount={searchResult?.length} isItemLoaded={(index) => { return searchResult.length < index;  }} loadMoreItems={() => { fetchNextPageSearchFollowing()}} >
                      {({ onItemsRendered, ref }) => <FixedSizeList onItemsRendered={onItemsRendered} ref={ref}  height={height}
                      itemCount={searchResult?.length}
                      itemSize={74}
                      width={width}
                    >
                        {({ index, style }: any) => {
                            return searchResult && searchResult.length > index && <div style={style}><ProfileCard profileId={searchResult[index]._id} disableDesc /></div>
                        }}    
                      </FixedSizeList>}
                    </InfiniteLoader>
                  </div>
                </React.Fragment> : <Empty />}
              </Container> */}

              {selectedTab === 'recommend' 
                ? <div className={style.refreshBtn} >
                    <Button onClick={handleRefresh} size="l" variant='primary'>
                      <div className={style.align} >
                        <Icon name={`Reset_M`} />
                        <div><Text locale={{ textId: 'GCM.000045' }} /></div>
                      </div>
                    </Button>
                  </div>
                : <></>
              }
            </div>
          </div>
        {/* </div> */}
      </View>
    </Modal>
  );
};

export default FollowFullScreenModal;
