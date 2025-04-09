import BalloonMessage from '@/pages/_shared/ui/BalloonMessage';
import { HTMLAttributes } from 'react';
import useMessageBox from './hooks';
import { ModeType } from '..';
import style from './style.module.scss';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import useRoom from '@/common/hooks/use-room';
type MemoMessageBoxProps = HTMLAttributes<HTMLDivElement> & {
  mode: ModeType;
  itemInstanceId: string;
};

const MemoMessageBox = ({
  mode,
  itemInstanceId,
  ...rest
}: MemoMessageBoxProps) => {
  const { itemFunctionData, onClickUrl, memoText, showDeletePopup } =
    useMessageBox(itemInstanceId);
  const { currentRoomInfo } = useRoom();

  return (
    <div className={style.itemFullScreenModalMemoMessageBoxWrapper} {...rest}>
      {memoText && (
        <>
          <div className={style.memoMessageWrapper}>
            <BalloonMessage
              messageText={memoText}
              className={style.memoMessage}
              iconName={'Memo_Noti_M'}
            />
            {currentRoomInfo?.mine && (
              <div className={style.delButton}>
                <CircleButton
                  shape="circle"
                  size="xxs"
                  onClick={showDeletePopup}
                >
                  <Icon name="Close_Bottom_S" />
                </CircleButton>
              </div>
            )}
          </div>
        </>
      )}
      <BalloonMessage
        className={style.messageBox}
        url={itemFunctionData?.linkUrl}
        subText={itemFunctionData?.linkAlias}
        urlCallback={onClickUrl[mode]}
      />
    </div>
  );
};

export default MemoMessageBox;
