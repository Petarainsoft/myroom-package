import Image from '@/components/Image';
import style from './style.module.scss';
import { BalloonData } from '@/apis/Social/Balloons/type';
import useBalloonData from '../../Hooks/useBalloonData';
import useBalloonItemTable from '../../Hooks/useBalloonItemTable';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import CustomButton from '@/components/Buttons/CustomButton';
import { useAtomValue } from 'jotai';
import {
  balloonListUIModeAtom,
  selectedBalloonMessageListIdsAtom,
} from '@/common/stores';
import { eBalloonListUIMode } from '../hooks';
import IconCheckBox from '@/components/Forms/CheckBox/IconCheckBox';
import { dFormatter } from '@/common/utils/string-format';

const BalloonMessageCell = ({
  data,
  //showReadMark,
  handleClick,
}: {
  data: BalloonData;
  showReadMark: boolean;
  handleClick: (data: BalloonData) => void;
}) => {
  const { writerSelfie, writerNickname, balloonThumbnail } =
    useBalloonData(data);
  const { letterBG } = useBalloonItemTable(data.balloon_item_id);
  const balloonListUIMode = useAtomValue(balloonListUIModeAtom);
  const selectedBalloonMessageListIds = useAtomValue(
    selectedBalloonMessageListIdsAtom,
  );
  const isInactive = data.option.endts - 1000 <= Date.now();
  return (
    <div>
      {/* {showReadMark ? (
        <div className={style.readMarkWrapper}>
          <span className={style.readMark}>
            <Text
              locale={{ textId: 'GMY.000154' }}
              defaultValue="여기까지 읽었습니다."
            />
          </span>
        </div>
      ) : null} */}
      <CustomButton
        className={style.messageWrapper}
        style={{ backgroundColor: letterBG }}
        onClick={() => {
          handleClick(data);
        }}
      >
        <div
          className={`${style.balloonIcon} ${
            isInactive ? style.inactive : style.active
          }`}
        >
          <Image src={balloonThumbnail} />
          {isInactive ? (
            <Image
              src={balloonThumbnail}
              className={style.balloonInactiveCover}
            />
          ) : null}
        </div>
        <div className={style.writerWrapper}>
          {balloonListUIMode === eBalloonListUIMode.View ? (
            <Profile
              className={`${style.writerSelfie}`}
              shape={'circle-br'}
              size="xl"
              src={writerSelfie}
            />
          ) : (
            <div className={style.checkboxWrapper}>
              <IconCheckBox
                onChange={() => {}}
                checked={selectedBalloonMessageListIds.includes(data._id)}
              />
            </div>
          )}

          <div className={style.writer}>
            <span>{writerNickname}</span>
            <span className={style.date}>{dFormatter(data.stat.created)}</span>
          </div>
        </div>
        <div className={style.contents}>{data.txt.snippet}</div>
      </CustomButton>
    </div>
  );
};
export default BalloonMessageCell;
