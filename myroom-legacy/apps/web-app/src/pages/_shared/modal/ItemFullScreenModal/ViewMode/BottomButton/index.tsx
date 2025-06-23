import { useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  currentMyRoomIdAtom,
  uiAppBarAtom,
  uiPlaceModeAtom,
  uiSignInSheetAtom,
} from '@/common/stores';
import { useNavigate } from 'react-router-dom';
import Text from '@/components/Text';
import useModal from '@/common/hooks/Modal/useModal';
import useAuth from '@/common/hooks/use-auth';
import CustomButton from '@/components/Buttons/CustomButton';
import useItemMemoAPI from '@/apis/Social/ItemMemo';
import useMe from '@/common/hooks/use-me';
import Icon from '@/components/Icon';
import useItemScrap from './hook';
import style from './style.module.scss';
import Skeleton from '@/components/Skeleton';

interface IBottomButton {
  isMyroom?: boolean;
  memoText: string;
  itemId: string;
  itemInstanceId: string;
  setMemoText: React.Dispatch<React.SetStateAction<string>>;
  onRequestClose: () => void;
}

enum EButtonType {
  IS_NOT_MYROOM,
  IS_MYROOM,
}
const BottomButton = ({
  isMyroom,
  itemId,
  memoText,
  onRequestClose,
  itemInstanceId,
}: IBottomButton) => {
  const [, setUISignInSheet] = useAtom(uiSignInSheetAtom);
  const { isLogined } = useAuth();
  const navigate = useNavigate();
  const { meRoomId } = useMe();
  const setCurrentRoom = useSetAtom(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
  const setPlaceMode = useSetAtom(uiPlaceModeAtom);
  const hideAppBar = useSetAtom(uiAppBarAtom);
  const { mutationPostItemMemo } = useItemMemoAPI();
  const { isFav, scrapNum, handleScrap, isLoadingFavData, isLoadingReaction } =
    useItemScrap(itemId);
  const type = useMemo(() => {
    return isMyroom ? EButtonType.IS_MYROOM : EButtonType.IS_NOT_MYROOM;
  }, [isMyroom]);

  const MemoCreateModal = useModal('MemoCreateModal');
  const handleCreateMemo = () => {
    MemoCreateModal.createModal({
      text: memoText,
      onComplete: (text: string) => handleSaveMemo(text),
    });
  };
  const handleSaveMemo = async (text: string) => {
    const res = await mutationPostItemMemo.mutateAsync({
      data: {
        item_id: itemId,
        item_instance_id: itemInstanceId,
        option: { language: 'ko' },
        myroom_id: meRoomId!,
        resource: { image: ['DCwlJ2m0llwRHAr4O3qbI', 'DCwlJ2m0llwRHAr4O3qbI'] },
        txt: { contents: text },
      },
    });
    if (res?.data) {
      return true;
    }
    return false;
  };

  const handleGetItemInPlaceMode = () => {
    if (isLogined) {
      onRequestClose();
      setPlaceMode(true);
      hideAppBar(true);
      setCurrentRoom(meRoomId!);
      navigate(`/rooms/me/place?itemId=${itemId}`);
    } else {
      setUISignInSheet(true);
    }
  };

  const handleActionButton = () => {
    const BUTTON_TYPE = {
      [EButtonType.IS_MYROOM]: handleCreateMemo,
      [EButtonType.IS_NOT_MYROOM]: handleGetItemInPlaceMode,
    };
    return BUTTON_TYPE[type];
  };

  const ActionButtonText = () => {
    const BUTTON_TYPE = {
      [EButtonType.IS_MYROOM]: (
        <Text locale={{ textId: 'GMY.000144' }} defaultValue="메모 작성하기" />
      ),
      [EButtonType.IS_NOT_MYROOM]: (
        <Text
          locale={{ textId: 'GMY.000145' }}
          defaultValue="내 마이룸에 배치하기"
        />
      ),
    };
    // console.log('ITEM- ActionButtonText ', BUTTON_TYPE);
    return BUTTON_TYPE[type];
  };

  return (
    <div className={style.bottomButtonWrapper}>
      <CustomButton className={style.scrapButton} onClick={handleScrap}>
        <div className={style.scrapInfo}>
          <Skeleton isLoading={isLoadingFavData} width={60} height={20}>
            <Icon
              className={style.scrapIcon}
              name={isFav ? 'Bookmark_S_On' : 'Bookmark_S'}
            />
            {scrapNum === 0 ? (
              <Text locale={{ textId: 'GCM.000047' }} defaultValue="스크랩" />
            ) : (
              scrapNum
            )}
          </Skeleton>
        </div>
      </CustomButton>
      <CustomButton
        className={style.actionButton}
        onClick={handleActionButton()}
      >
        <ActionButtonText />
      </CustomButton>
    </div>
  );
};

export default BottomButton;
