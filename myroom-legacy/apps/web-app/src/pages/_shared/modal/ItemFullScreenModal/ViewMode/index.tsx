import useModal from '@/common/hooks/Modal/useModal';
import { useCallback } from 'react';
import {
  isOpenLinkPreviewAtom,
  itemFunctionDataAtom,
  memoTextAtom,
} from '../store';
import { useAtom, useAtomValue } from 'jotai';
import BottomButton from './BottomButton';
import LinkPreviewOffCanvas from '@/pages/_shared/offcanvas/LinkPreviewOffCanvas';
import useRoom from '@/common/hooks/use-room';
interface IViewMode {
  itemId: string;
  itemInstanceId: string;
}
const ViewMode = ({ itemId, itemInstanceId }: IViewMode) => {
  const { currentRoomInfo  } = useRoom();
  const [memoText, setMemoText] = useAtom(memoTextAtom);

  const ItemFullScreenModal = useModal('ItemFullScreenModal');
  const itemFunctionData = useAtomValue(itemFunctionDataAtom);
  const [isOpenLinkPreview, setIsOpenLinkPreview] = useAtom(
    isOpenLinkPreviewAtom,
  );
  const handleCloseModal = useCallback(() => {
    ItemFullScreenModal.deleteModal();
  }, [ItemFullScreenModal]);
  const handleCloseLinkPreview = useCallback(() => {
    setIsOpenLinkPreview(false);
  }, []);

  return (
    <>
      {/* <HeaderLeft
        onClickButton={handleCloseModal}
        nickName={roomOwnerNickName}
        thumbnail={roomOwnerThumnail}
        ButtonIcon={'Close_M'}
      /> */}
      <BottomButton
        isMyroom={currentRoomInfo?.mine}
        memoText={memoText}
        setMemoText={setMemoText}
        onRequestClose={handleCloseModal}
        itemId={itemId}
        itemInstanceId={itemInstanceId}
      />
      {itemFunctionData?.linkUrl && (
        <LinkPreviewOffCanvas
          isOpen={isOpenLinkPreview}
          onClose={handleCloseLinkPreview}
          url={itemFunctionData?.linkUrl}
        />
      )}
    </>
  );
};
export default ViewMode;
