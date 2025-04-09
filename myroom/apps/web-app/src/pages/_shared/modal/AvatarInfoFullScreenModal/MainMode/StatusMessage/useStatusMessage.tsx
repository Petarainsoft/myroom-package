import useStatusMessageAPI from '@/apis/Social/StatusMessage';
import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import {
  currentStatusMessageIdAtom,
  editedStatusActionIdAtom,
  isFirstStatusMessageAtom,
  statusActionIdAtom,
} from '@/common/stores';

const useStatusMessageInClickMode = (profileId: string) => {
  const [statusMessageInput, setStatusMessageInput] = useState('');
  const [statusImageId, setStatusImageId] = useState('');
  const [, setCurrentStatusMessageId] = useAtom(currentStatusMessageIdAtom);

  const [, setIsFirstStatusMessage] = useAtom(isFirstStatusMessageAtom);
  const [, setStatusActionId] = useAtom(statusActionIdAtom);
  const [, setEditedStatusActionId] = useAtom(editedStatusActionIdAtom);
  const { fetchProfileResourceStatusMessage } = useStatusMessageAPI();
  const { data, isLoading } = fetchProfileResourceStatusMessage({
    profileId,
  });

  //상태메시지 정보 패치
  const updateStatusMessage = (item: any) => {
    //상태메시지 아이디 저장
    setCurrentStatusMessageId(item?.feed_id || item?._id);
    //액션있을 때 액션아이디 저장
    if (item.resource?.action && !!item.resource?.action[0].length) {
      setStatusActionId(item.resource.action[0]);
      setEditedStatusActionId(item.resource.action[0]);
      setIsFirstStatusMessage(false);
    } else {
      //최초 상태 메시지를 불러올 때 action이 없음
      setIsFirstStatusMessage(true);
    }

    //이미지 O 텍스트 X
    if (item.resource?.image[1]) {
      setStatusImageId(item.resource.image[1]);
      setStatusMessageInput('');

      return;
    }
    //이미지 X 텍스트 O
    if (!item.resource?.image[1] && item.txt?.contents) {
      setStatusMessageInput(item.txt.contents);
      setStatusImageId('');

      return;
    }
    //이미지 X 텍스트 X
    setStatusImageId('');
    setStatusMessageInput('');
  };
  const resetData = () => {
    setStatusImageId('');
  };

  const useFetchStatusMessage = (messageStatusData: any) => {
    resetData();
    const StatusMessageItem = messageStatusData.data;
    updateStatusMessage(StatusMessageItem);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!data) return;
    useFetchStatusMessage(data);
  }, [data, isLoading]);

  return { text: statusMessageInput, imageId: statusImageId };
};

export default useStatusMessageInClickMode;
