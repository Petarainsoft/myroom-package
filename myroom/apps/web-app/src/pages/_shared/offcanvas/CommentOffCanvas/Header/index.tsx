import { nFormatter } from '@/common/utils/string-format';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import CommentWrite from '../Write';
import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';

type CommentHeaderProps = {
  targetId: string;
  targetProfileId: string;
  count: number;
  handleClickRefesh: () => Promise<void>;
};

const CommentHeader = ({
  targetId,
  targetProfileId,
  count,
  handleClickRefesh,
}: CommentHeaderProps) => {
  return (
    <div className={style['wrap']}>
      <div className={style['info']}>
        <div className={style['text']}>
          <Text locale={{ textId: 'GCM.000023' }} />
        </div>
        <div className={style['count']}>{nFormatter(count)}</div>
        <CustomButton onClick={handleClickRefesh}>
          <Icon name={'Reset_M'} />
        </CustomButton>
      </div>
      <CommentWrite
        profileOption={{
          shape:"circle-br"
        }}
        variant="primary"
        targetId={targetId}
        targetProfileId={targetProfileId}
        initText={''}
      />
    </div>
  );
};

export default CommentHeader;
