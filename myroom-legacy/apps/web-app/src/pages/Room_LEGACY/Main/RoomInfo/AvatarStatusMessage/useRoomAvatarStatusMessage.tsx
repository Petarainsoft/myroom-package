import useStatusMessageAPI from '@/apis/Social/StatusMessage';
import { useEffect, useState } from 'react';

const useRoomAvatarStatusMessage = (profileId: string) => {
  const { fetchProfileResourceStatusMessage } = useStatusMessageAPI();
  const [imageId, setImageId] = useState('');
  const [text, setText] = useState('');
  const [feedId, setFeedId] = useState('');
  const [avatarThumbnail, setAvatarThumbnail] = useState('');
  const [createTime, setCreateTime] = useState<null | number>(null);
  const { data: statusMessageData, isLoading } =
    fetchProfileResourceStatusMessage({
      profileId,
    });

  const fetchStatusMessage = (item: any) => {
    //이미지 O 텍스트 X
    setAvatarThumbnail(item.resource?.image[0]);
    if (item.resource?.image[1]) {
      setImageId(item.resource?.image[1]);
      setText('');
      return;
    }
    //이미지 X 텍스트 O
    if (!item.resource?.image[1] && item.txt?.contents) {
      setText(item.txt?.contents);
      setImageId('');
      return;
    }
    //이미지 X 텍스트 X
    setImageId('');
    setText('');
  };

  const fetchData = (item: any) => {
    fetchStatusMessage(item);
    setFeedId(item?.feed_id);
    setCreateTime(item?.option?.startts);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!statusMessageData) return;
    fetchData(statusMessageData.data);
  }, [statusMessageData, isLoading]);

  return { isLoading, avatarThumbnail, text, imageId, feedId, createTime };
};

export default useRoomAvatarStatusMessage;
