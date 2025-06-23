import useCommentAPI from '@/apis/Social/Comment';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import useProfileAPI from '@/apis/User/Profile';
import BalloonMessage from '@/pages/_shared/ui/BalloonMessage';
import style from './style.module.scss';
import { getProfileThumbnail } from '@/common/utils/profile';
interface ICommentItem {
  feedId: string;
  onClickComment: (id: string) => void;
}
const CommentItem = ({ feedId, onClickComment }: ICommentItem) => {
  const { fetchComments } = useCommentAPI();
  const { fetchProfile } = useProfileAPI();

  const { data } = fetchComments({
    target_id: feedId!,
    order: 'desc',
    limit: 15,
    orderby: 'recent',
  });

  const { data: profileData } = fetchProfile(
    data?.pages[0]?.list && data.pages[0]?.list[0]?.profile_id
      ? data.pages[0]?.list[0].profile_id
      : undefined,
  );
  if (!data?.pages[0]?.list || !data?.pages[0]?.list[0]) return <></>;

  return (
    <div className={style.flex}>
      <div
        className={style.commentBalloonMessageWrapper}
        onClick={() => onClickComment(feedId)}
      >
        <BalloonMessage
          profileImage={
            <Profile
              shape={'circle'}
              size="xs"
              src={getProfileThumbnail(profileData)}
            />
          }
          messageText={data?.pages[0]?.list[0].txt.contents}
        />
      </div>
    </div>
  );
};

export default CommentItem;
