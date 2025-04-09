import style from './style.module.scss';
import Image from '@/components/Image';
import CustomButton from '@/components/Buttons/CustomButton';
import { BalloonData } from '@/apis/Social/Balloons/type';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import useBalloonData from '../../Hooks/useBalloonData';
import useBalloonItemTable from '../../Hooks/useBalloonItemTable';
import Icon from '@/components/Icon';
import useBalloonsPatch from '../../Hooks/useBalloonsPatch';
import usePopup from '@/common/hooks/Popup/usePopup';
import { dFormatter } from '@/common/utils/string-format';
import Text from '@/components/Text';
import { t } from 'i18next';
import useRoom from '@/common/hooks/use-room';

const BalloonSlideContent = ({ data }: { data: BalloonData }) => {
  const { currentRoomInfo } = useRoom();
  const { writerSelfie, writerNickname, writerMyRoomId, balloonThumbnail } =
    useBalloonData(data);
  const isOwnRoom = currentRoomInfo?.mine;
  const { showToastPopup } = usePopup();
  const { patchBalloonsState } = useBalloonsPatch();
  const { letterBG } = useBalloonItemTable(data.balloon_item_id);
  const isInactive = data.option.endts - 1000 <= Date.now();

  const onClickInactiveButton = () => {
    patchBalloonsState(
      data.myroom_id,
      [data._id],
      'inactivate',
      false,
      (res) => {
        const findData = res?.list.find((item) => item._id === data._id);
        if (findData) {
          showToastPopup({
            titleText: t('GMY.000173'), //'보관 되었습니다. 이 풍선은 마이룸에 노출되지 않습니다.',
          });
        }
      },
    );
  };
  const onClickActiveButton = () => {
    patchBalloonsState(data.myroom_id, [data._id], 'activate', false, (res) => {
      const findData = res?.list.find((item) => item._id === data._id);
      if (findData) {
        showToastPopup({
          titleText: t('GMY.000174'), //'다시 날려졌습니다. 마이룸에 7일간 무작위로 노출됩니다.',
        });
      }
    });
  };
  const onClickVisitMyRoom = () => {
    location.href = `/rooms/${writerMyRoomId}`;
  };
  return (
    <div
      className={`${style.wrapper} ${
        isInactive ? style.inactive : style.active
      }`}
      style={{ backgroundColor: letterBG }}
    >
      <div className={style.balloonImage}>
        <Image src={balloonThumbnail} />
        {isInactive ? (
          <Image
            src={balloonThumbnail}
            className={style.balloonInactiveCover}
          />
        ) : null}
      </div>
      {isInactive ? (
        <div className={style.isInactiveMark}>
          <Icon name="Keep_S" />
        </div>
      ) : null}
      <div className={style.content}>
        {isOwnRoom ? (
          <CustomButton
            className={style.btnBalloonAction}
            onClick={isInactive ? onClickActiveButton : onClickInactiveButton}
          >
            <div className={style.actionBtnIcon}>
              <Icon name="Keep_M"></Icon>
            </div>
            {isInactive ? (
              <div className={style.actionBtnText}>
                <Text
                  locale={{ textId: 'GMY.000160' }}
                  defaultValue="다시 날리기"
                />
              </div>
            ) : (
              <div className={style.actionBtnText}>
                <Text
                  locale={{ textId: 'GMY.000053' }}
                  defaultValue="보관하기"
                />
              </div>
            )}
          </CustomButton>
        ) : null}

        {data.txt?.contents ?? ''}
      </div>
      <div className={style.writerWrapper}>
        <Profile src={writerSelfie} size="xl" shape="circle-br" />

        <div className={style.info}>
          <div className={style.nickname}>{writerNickname}</div>
          <div className={style.bottomWrapper}>
            <CustomButton
              className={style.btnVisitRoom}
              onClick={onClickVisitMyRoom}
            >
              <Text
                locale={{ textId: 'GMY.000172' }}
                defaultValue="마이룸 방문하기"
              />
              <Icon name="Arrow_Right_SS" />
            </CustomButton>
            <span className={style.writeDate}>
              {dFormatter(data.stat.created)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BalloonSlideContent;
