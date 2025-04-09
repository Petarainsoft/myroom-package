import TextArea from '@/components/Forms/TextArea';
import { VariantType } from '@/common/types';
import style from './style.module.scss';
import useCommentWrite from './hooks';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import { t } from 'i18next';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';

type ProfileOption = {
  disabled?: boolean;
  shape?: 'circle' | 'circle-bl' | 'circle-br';
}

type CommentWriteProps = {
  profileOption: ProfileOption;
  variant: VariantType;
  targetId: string;
  targetProfileId: string;
  parentId?: string;
  parentProfileId?: string;
  mention?: boolean;
  initText: string;
  commentId?: string;

  handleAfterSubmit?: () => void;
  handleClickCancel?: () => void;
};
const CommentWrite = ({
  profileOption,
  initText,
  targetId,
  targetProfileId,
  parentId,
  parentProfileId,
  mention,
  variant,
  commentId,
  handleAfterSubmit,
  handleClickCancel,
}: CommentWriteProps) => {

  const {
    ref,
    comment,
    isLogined,
    mentionName,
    meThumbnail,
    handleChangeComment,
    handleClickSignin,
    handleClickWriteComment,
    handleFocusTextArea,
  } = useCommentWrite({
    initComment: initText,
    targetId,
    targetProfileId,
    parentId,
    commentId,
    parentProfileId,
    mention,
    handleAfterSubmit,
    handleClickEditCancel: handleClickCancel,
  });
  
  const Buttons = () => {
    if (!isLogined) {
      return (
        <Button variant="tertiary" size="s" onClick={handleClickSignin}>
          <Text locale={{ textId: '#로그인' }} />
        </Button>
      );
    }

    if (comment.length > 0) {
      return (
        <>
          {commentId && (
            <CustomButton onClick={handleClickCancel}>
              <Icon name="Close_M" />
            </CustomButton>
          )}

          <CustomButton onClick={()=> handleClickWriteComment(comment)}>
            <Icon name="Send_M" />
          </CustomButton>
        </>
      );
    } else {
      return <></>;
    }
  };

  return (
    <div className={style['wrap']}>
      {!profileOption?.disabled && <Profile className={style['profile']} shape={profileOption?.shape} size="xl" src={meThumbnail} />}
      <TextArea
        fixedText={mention? mentionName : undefined}
        variant={variant}
        value={comment}
        minRows={1}
        maxRows={3}
        onChange={handleChangeComment}
        placeholder={t(isLogined ? 'GMY.000032' : 'GMY.000031')}
        disabled={!isLogined}
        buttonOptions={{
          element: <Buttons />,
        }}
        ref={ref}
        onFocus={handleFocusTextArea}
      />
    </div>
  );
};

export default CommentWrite;
