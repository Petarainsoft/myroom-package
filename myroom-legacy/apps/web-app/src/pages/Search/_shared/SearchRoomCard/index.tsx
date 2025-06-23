import CustomButton from '@/components/Buttons/CustomButton';
import useSearchRoomCard from './hooks';
import styles from './styles.module.scss';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import classNames from 'classnames';
import Skeleton from '@/components/Skeleton';
import { getProfileThumbnail } from '@/common/utils/profile';

type SearchRoomCardProps = {
  id: string;
  className?: string;
};

const SearchRoomCard = ({ id, className }: SearchRoomCardProps) => {
  const { isLoading, profileData, roomData, handleClick } =
    useSearchRoomCard(id);

  return (
    <CustomButton
      className={classNames(styles['wrap'], className)}
      key={id}
      onClick={handleClick}
    >
      <div
        className={styles['thumnail']}
        style={{
          backgroundImage: `url('${roomData?.data?.resource?.thumbnail}')`,
          backgroundColor: profileData?.data?.option?.background_color,
        }}
      >
        <Skeleton isLoading={isLoading} />
      </div>
      <div className={styles['title']}>
        <Skeleton isLoading={isLoading}>{roomData?.data?.txt?.title}</Skeleton>
      </div>
      <div className={styles['profile-box']}>
        <Skeleton isLoading={isLoading}>
          <Profile
            className={styles['icon']}
            size={'xs'}
            shape="circle"
            src={getProfileThumbnail(profileData)}
          />
          <span>{profileData?.data?.option?.nick}</span>
        </Skeleton>
      </div>
    </CustomButton>
  );
};

export default SearchRoomCard;
