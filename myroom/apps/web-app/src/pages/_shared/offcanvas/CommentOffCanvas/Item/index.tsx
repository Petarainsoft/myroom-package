import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import CommentWrite from '../Write';
import { dFormatter, nFormatter } from '@/common/utils/string-format';
import styles from './style.module.scss';
// import ActionSheet from './ActionSheet';
import useCommentItem from './hooks';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import classNames from 'classnames';
import SelectOffCanvas from '@/pages/_shared/offcanvas/SelectOffCanvas';
import { getProfileThumbnail } from '@/common/utils/profile';

type CommentItemProps = {
  commentId: string;
  profileId: string;
  targetId: string;
  targetProfileId: string;
  parentId?: string;
  mentionId?: string;
  contents: string;
  created: number;
  loading: boolean;
};

const CommentItem = ({
  profileId,
  commentId,
  targetId,
  targetProfileId,
  parentId,
  contents,
  created,
  // loading,
  mentionId,
}: CommentItemProps) => {
  const {
    childrenCommentsData,
    profileData,
    isProfileLoading,
    showMenu,
    isEdit,
    isChildrenWrite,
    isChildrenRead,
    childrenTotalCount,
    inViewRef,
    meProfileId,
    mentionData,
    likeCount,
    liked,
    actions,
    handleClickShowMenu,
    handleClickLike,
    handleClickChildrenWrite,
    handleClickChildrenRead,
    handleClickHideMenu,
    handleClickEditCancel,
    handleAfterSubmit,
  } = useCommentItem(
    targetId,
    targetProfileId,
    commentId,
    profileId,
    parentId,
    mentionId,
  );

  return (
    <>
      <li
        className={classNames(styles['wrap'], {
          [styles['parent']]: !parentId,
        })}
        key={commentId}
      >
        <div className={styles['header-wrap']}>
          <Profile
            shape={'circle'}
            size="s"
            src={getProfileThumbnail(profileData)}
          />
          <div className={styles['nickname']}>
            <Text
              isLoading={isProfileLoading}
              text={profileData?.data?.option?.nick}
            />
            {meProfileId === targetProfileId && (
              <div className={styles['mine']}>
                <Text text="👑" />
              </div>
            )}
          </div>
          {!isEdit && (
            <CustomButton onClick={handleClickShowMenu}>
              <Icon name={'Menu_User_SS'} />
            </CustomButton>
          )}
        </div>
        <div className={styles['contents-wrap']}>
          <div className={styles['contents-container']}>
            {isEdit ? (
              <CommentWrite
                profileOption={{
                  disabled: true,
                }}
                initText={contents}
                commentId={commentId}
                parentId={parentId ? parentId : undefined}
                parentProfileId={profileId}
                targetId={targetId}
                targetProfileId={targetProfileId}
                mention={parentId ? true : false}
                variant={'none'}
                handleClickCancel={handleClickEditCancel}
              />
            ) : (
              <>
                <div className={styles['contents']}>
                  {mentionId && (
                    <span className={styles['mention']}>
                      <Text text={`@${mentionData?.data?.option?.nick}  `} />
                    </span>
                  )}
                  <Text text={contents} />
                </div>
                <div>
                  <CustomButton onClick={handleClickLike}>
                    {liked ? (
                      <Icon name={'Heart_SS_On'} />
                    ) : (
                      <Icon name={'Heart_SS'} />
                    )}
                  </CustomButton>
                </div>
              </>
            )}
          </div>
          <div className={styles['footer-container']}>
            <div className={styles['info']}>
              <div className={styles['like']}>
                <Text
                  locale={{
                    textId: `GCM.000050`,
                    values: { 0: likeCount },
                  }}
                />
              </div>
              <div className={styles['read']}>
                <CustomButton onClick={handleClickChildrenWrite}>
                  <Text locale={{ textId: 'GMY.000033' }} />
                </CustomButton>
              </div>
            </div>
            <div className={styles['time']}>
              <Text text={dFormatter(created)} />
            </div>
          </div>
          {childrenTotalCount > 0 && (
            <div className={styles['more-read-container']}>
              <div className={styles['more-read']}>
                <CustomButton onClick={handleClickChildrenRead}>
                  <Text
                    locale={{
                      textId: 'GMY.000034',
                      values: { 0: nFormatter(childrenTotalCount) },
                    }}
                  />
                </CustomButton>
              </div>
            </div>
          )}
        </div>
      </li>
      {isChildrenWrite && (
        <li
          className={classNames({
            [styles['children-write-wrap']]: !parentId,
          })}
        >
          <CommentWrite
            profileOption={{ shape: 'circle-br' }}
            initText={''}
            parentId={parentId ? parentId : commentId}
            parentProfileId={profileId}
            targetId={targetId}
            targetProfileId={targetProfileId}
            mention={parentId ? true : false}
            variant={'primary'}
            handleAfterSubmit={handleAfterSubmit}
          />
        </li>
      )}
      {!parentId && isChildrenRead && (
        <li
          className={classNames({
            [styles['parent']]: !parentId,
          })}
          key={`children-${commentId}`}
        >
          <ul className={styles['children-wrap']}>
            {childrenCommentsData?.pages?.map(
              (p) =>
                p?.list?.map((item) => (
                  <CommentItem
                    key={item._id}
                    commentId={item._id}
                    targetProfileId={targetProfileId}
                    targetId={targetId}
                    parentId={commentId}
                    mentionId={item.mention_id}
                    profileId={item.profile_id}
                    contents={item.txt?.contents}
                    created={item.stat?.created}
                    loading={false}
                  />
                )),
            )}
            <li className={styles['observer']} ref={inViewRef}></li>
          </ul>
        </li>
      )}
      {showMenu && (
        <SelectOffCanvas
          isOpen={showMenu}
          onClose={handleClickHideMenu}
          buttonList={actions}
          isIconButton={true}
        />
      )}
    </>
  );
};

export default CommentItem;
