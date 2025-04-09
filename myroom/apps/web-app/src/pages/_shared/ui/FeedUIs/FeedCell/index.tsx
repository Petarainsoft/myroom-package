import ProfileThumnail from '@/pages/_shared/ui/Profiles/Profile';
import style from './style.module.scss';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import CircleButton from '@/components/Buttons/CircleButton';
import CustomButton from '@/components/Buttons/CustomButton';
import { useCallback, useState } from 'react';
import ToolTip from '@/pages/_shared/ui/ToolTip';
import { FeedData } from '@/apis/Social/Feeds/type';
import useProfile from '../../../../Profile/useProfile';
import { useAtomValue } from 'jotai';
import { meProfileIdAtom } from '@/common/stores';
import Image from '@/components/Image';
const FeedCell = ({ feedData }: { feedData: FeedData }) => {
  const meProfileId = useAtomValue(meProfileIdAtom);
  const { nickName, thumbnailPath, userName } = useProfile({
    profileId: feedData.profile_id,
    isMine: meProfileId === feedData.profile_id,
  });
  console.log('FeedData : ', feedData);
  const Header = () => {
    const [isShowMenu, setIsShowMenu] = useState(false);
    const onClickMenu = useCallback(() => {
      setIsShowMenu(!isShowMenu);
    }, [isShowMenu, setIsShowMenu]);
    return (
      <div className={style.header}>
        <ProfileThumnail
          className={style.profileThumbnail}
          shape={'circle-br'}
          size="xl"
          src={thumbnailPath}
        />
        <div className={style.userInfoWrapper}>
          <div className={style.nicknameWrapper}>
            <div className={style.nickname}>
              <Text text={nickName} />
            </div>
            <Icon name={`Certified_Check_S`} />
          </div>
          <div className={style.accountNameWrapper}>
            <div className={style.accountName}>
              <Text text={`@${userName}`} />
            </div>
            <Icon name="Lock_SS" />
          </div>
        </div>
        <div className={style.rightSide}>
          <CircleButton size="s" shape="none" onClick={onClickMenu}>
            <Icon name="Menu_User_SS" />
          </CircleButton>
          <div className={style.timeStamp}>9시간 전</div>
          {isShowMenu ? <Menu /> : null}
        </div>
      </div>
    );
  };
  const Menu = () => {
    return (
      <ToolTip shape="rt" showClose={false} className={style.menu}>
        <MenuItem icon="Lock_Open_S" textId="전체 공개" onClick={() => {}} />
        <MenuItem icon="Lock_S" textId="나만 보기" onClick={() => {}} />
        <MenuItem icon="Erase_S" textId="삭제" onClick={() => {}} />
      </ToolTip>
    );
  };
  const MenuItem = ({
    icon,
    textId,
    onClick,
  }: {
    icon: string;
    textId: string;
    onClick: () => void;
  }) => {
    return (
      <CustomButton className={style.menuItem} onClick={onClick}>
        <Icon name={icon} />
        <div className={style.menuText}>
          <Text locale={{ textId: textId }} />
        </div>
      </CustomButton>
    );
  };
  const Body = () => {
    return (
      <div className={style.body}>
        {feedData.resource.image
          ? feedData.resource.image.map((image) => <Image src={image} />)
          : null}
        {feedData.resource.video
          ? feedData.resource.video.map((video) => (
              <video src={video} autoPlay={false} />
            ))
          : null}
      </div>
    );
  };
  const Footer = () => {
    return (
      <div className={style.footer}>
        <CustomButton className={style.btnLike}>
          <Icon name="Heart_S" />
          <div>{feedData.stat.reaction.like}</div>
        </CustomButton>
        <CustomButton className={style.btnComment}>
          <Icon name="Comment_S" />
          <div>{feedData.stat.comment}</div>
        </CustomButton>
        <CustomButton className={style.btnBookMark}>
          <Icon name="Bookmark_S" />
        </CustomButton>
      </div>
    );
  };
  return (
    <div>
      <Header />
      <Body />
      <Footer />
    </div>
  );
};
export default FeedCell;
