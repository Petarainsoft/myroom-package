import { useEffect, useState } from 'react';
import StatusMessageText from '../../../AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageText';
import StatusMessageImage from '../../../AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageImage';
enum EStatusMessageType {
  MESSAGE,
  IMAGE,
  NONE,
}
interface IStatusMessageItem {
  text?: string;
  imageId?: string;
}
const StatusMessageItem = ({ text, imageId }: IStatusMessageItem) => {
  const [statusMessageType, setStatusMessageType] = useState(
    EStatusMessageType.NONE,
  );

  const StatusMessageComponent = {
    [EStatusMessageType.MESSAGE]: <StatusMessageText text={text!} />,
    [EStatusMessageType.IMAGE]: <StatusMessageImage id={imageId!} />,
    [EStatusMessageType.NONE]: <></>,
  };

  useEffect(() => {
    if (!imageId && !text) {
      setStatusMessageType(EStatusMessageType.NONE);
      return;
    }
    if (imageId) {
      setStatusMessageType(EStatusMessageType.IMAGE);
      return;
    }
    if (text) {
      setStatusMessageType(EStatusMessageType.MESSAGE);
      return;
    }
  }, [text, imageId]);

  return <>{StatusMessageComponent[statusMessageType]}</>;
};

export default StatusMessageItem;
