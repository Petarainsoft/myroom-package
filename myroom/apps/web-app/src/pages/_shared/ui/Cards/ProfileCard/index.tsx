import React from 'react';
import ProfileThumnail from '@/pages/_shared/ui/Profiles/Profile';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import useProfileCard from './hooks';
import { ProfileCardProps } from './type';
import Skeleton from '@/components/Skeleton';
import style from './style.module.scss';
import { getProfileThumbnail } from '@/common/utils/profile';

export const ProfileCard = ({
  profileId,
  disableDesc = true,
}: ProfileCardProps): React.ReactElement => {
  const {
    meProfileId,
    profileData,
    profileCnt,
    handleFollow,
    handleProfileClick,
    isFollowing,
    isProfileLoading,
    isLoadingFollowMeData,
  } = useProfileCard({ profileId, disableDesc });

  if (meProfileId === profileId) return <></>;
  if (!profileData || profileData.error) return <></>;
  const imagePath = getProfileThumbnail(profileData);
  const userName = profileData.data.name;
  const userNick = profileData.data.option.nick;
  const count = profileCnt && profileCnt.data?.follower;
  const desc = profileData.data.txt?.desc;

  return (
    <div className={style.user}>
      <div className={style.userInfo}>
        <Skeleton isLoading={isProfileLoading}>
          <ProfileThumnail
            onClick={handleProfileClick}
            className={style.profileImage}
            shape={'circle-br'}
            size="xxl"
            src={imagePath}
          />
          <div className={style.userName}>
            <div className={style.userNick}>
              <Text text={userNick} />
            </div>
            <div className={style.userAccFollow}>
              <div>
                <Text text={`@${userName}`} />
              </div>
              <Skeleton isLoading={isLoadingFollowMeData}>
                <div>
                  <Text
                    locale={{ textId: 'GPF.000003', values: { 0: count } }}
                  />
                </div>
              </Skeleton>
            </div>
            {disableDesc ? (
              <></>
            ) : desc && desc.length !== 0 ? (
              <div className={style.userDesc}>{desc}</div>
            ) : (
              <></>
            )}
          </div>
        </Skeleton>
      </div>
      <div>
        {isFollowing ? (
          <Button
            onClick={handleFollow(profileId, isFollowing)}
            size="s"
            variant="tertiary"
          >
            <Text locale={{ textId: 'GMY.000024' }} />
          </Button>
        ) : (
          <Button
            onClick={handleFollow(profileId, isFollowing)}
            size="s"
            variant="none"
          >
            <Text locale={{ textId: 'GMY.000025' }} />
          </Button>
        )}
      </div>
    </div>
  );
};
