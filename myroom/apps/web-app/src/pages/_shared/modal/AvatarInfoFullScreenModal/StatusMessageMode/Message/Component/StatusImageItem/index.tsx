// import useResourceAPI from '@/apis/Resource';
import style from './style.module.scss';
import useModal from '@/common/hooks/Modal/useModal';
import { useAtomValue, useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import Image from '@/components/Image';

import {
  EditedStatusImageAtom,
  copiedStatusImageIdAtom,
} from '@/common/stores';

const StatusImageItem = () => {
  const ImageFullScreenModal = useModal('ImageFullScreenModal');
  const copiedStatusImageId = useAtomValue(copiedStatusImageIdAtom);
  const [editedStatusMessage, setEditedStatusMessage] = useAtom(
    EditedStatusImageAtom,
  );
  const [statusImageSrc, setStatusImageSrc] = useState<string>();

  const handleOpenImageFullScreen = async () => {
    ImageFullScreenModal.createModal({
      editedImageSrc: editedStatusMessage?.fileUrl,
      id: copiedStatusImageId,
    });
  };

  useEffect(() => {
    if (editedStatusMessage?.fileUrl) {
      setStatusImageSrc(editedStatusMessage?.fileUrl);
      return;
    }
    if (copiedStatusImageId) {
      setStatusImageSrc(copiedStatusImageId);

      return;
    }
  }, [editedStatusMessage?.fileUrl]);

  useEffect(() => {
    if (!editedStatusMessage?.file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) return;
      setEditedStatusMessage({
        file: editedStatusMessage.file,
        fileUrl: reader.result.toString(),
      });
    };
    reader.readAsDataURL(editedStatusMessage!.file);
  }, [editedStatusMessage?.file]);
  return (
    <div
      className={style.statusImageInEditor}
      onClick={handleOpenImageFullScreen}
    >
      <Image src={statusImageSrc!} alt="statusImage" />
    </div>
  );
};

export default StatusImageItem;
