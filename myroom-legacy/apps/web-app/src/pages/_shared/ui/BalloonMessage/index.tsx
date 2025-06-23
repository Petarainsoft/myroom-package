import Icon from '@/components/Icon';
import Text from '@/components/Text';
import cx from 'classnames';

import './style.scss';

export interface IBalloonMessage extends React.HTMLAttributes<HTMLDivElement> {
  messageText?: string;
  subText?: string;
  url?: string;
  iconName?: string;
  urlCallback?: () => void;
  profileImage?: JSX.Element;
  isRoomMemo?: boolean;
}
const BalloonMessage = ({
  messageText,
  subText,
  url,
  className,
  iconName,
  urlCallback,
  profileImage,
  isRoomMemo = false,
}: IBalloonMessage) => {
  const BallonMessageText = () => {
    if (profileImage) {
      return (
        <div className={'BalloonMessage'}>
          <div className={'profileImageWrapper'}>{profileImage}</div>
          <div className={cx('textWrapper', 'commentText')}>
            <Text text={messageText} />
          </div>
        </div>
      );
    }
    return (
      <div className={'BalloonMessage'}>
        {iconName && (
          <div className="TextIconWrapper">
            <Icon name={iconName} />
          </div>
        )}
        <div className={cx('textWrapper', { roomMemo: isRoomMemo })}>
          <Text text={messageText} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cx(
        'BalloonMessageWrapper',
        { textBalloon: !url && messageText },
        { commentBalloon: !!profileImage },
        className,
      )}
    >
      {url && (
        <div className={'BalloonMessage'} onClick={urlCallback}>
          <div className={'iconWrapper'}>
            <Icon name="Link_S" />
          </div>
          <div className="urlText">
            <Text text={subText ? subText : url} />
          </div>
        </div>
      )}
      {!url && messageText && <BallonMessageText />}
    </div>
  );
};

export default BalloonMessage;
