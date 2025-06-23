import React, { useCallback, useMemo, useState } from 'react';
import { SceneManager } from '@/common/utils/client';
import styles from './styles.module.scss';
import StatusMessageText from '@/pages/_shared/modal/AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageText';
import StatusMessageImage from '@/pages/_shared/modal/AvatarInfoFullScreenModal/MainMode/StatusMessage/StatusMessageImage';
import useRoom from '@/common/hooks/use-room';
import useStatusMessage from '@/common/hooks/use-status-message';
import useItemPosition from '@/common/hooks/use-item-position';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import InputText from '@/components/Forms/InputText';
import CommentOffCanvas from '@/pages/_shared/offcanvas/CommentOffCanvas';
import useReactionAPI from '@/apis/Social/Reaction';

interface IAvatarStatusMessage {
  id: string;
  profileId: string;
  isAvatar: boolean;
}
const AvatarStatusMessage = ({ id, profileId, isAvatar }: IAvatarStatusMessage) => {
  const { fetchMyReaction, mutationPostReaction } = useReactionAPI();
  const { showAlwaysRoomInfo, roomSelectedItem } = useRoom();
  const { statusMessage, statusImage, feedId } = useStatusMessage(profileId);
  const {ref, callbackCanvasPositionEvent} = useItemPosition();
  const [showComment, setShowComment] = useState(false);
  const { data: meReactionData, isLoading: isMeReactionLoading } = fetchMyReaction(feedId);
  
  
  const isLiked = useMemo(() => { 
      if (!isMeReactionLoading) {
          return meReactionData?.data?.stat?.reaction?.like && meReactionData?.data?.stat?.reaction?.like > 0 ? true : false;
      }

      return false;
  }, [isMeReactionLoading, meReactionData]);

  const handleToggleLike = useCallback(async () => { 
      await mutationPostReaction.mutateAsync({
          id: feedId,
          params: {
              origin_profile_id: feedId,
              reaction: "like"
          }
      });
  }, [feedId, mutationPostReaction]);

  React.useEffect(() => {
    SceneManager.Room?.addCallbackCanvasPositionEventHandler_Figure_Top(id, callbackCanvasPositionEvent);
    return () => {
      SceneManager.Room?.clearCallbackCanvasPostionEventHander_Figure_Top(id);
    };
  }, [ref, id]);


  const Status = useCallback(() => {
    if (isAvatar || showAlwaysRoomInfo || roomSelectedItem?.id === id) {
      if (statusMessage) {
        return (
          <div className={styles.roomStatusMessage}>
            <StatusMessageText text={statusMessage} />
          </div>
        );
      }
      else if (statusImage) {
        return (
          <div className={styles.roomStatusMessage}>
            <StatusMessageImage id={statusImage} />
          </div>
        );
      }
    }
    else {
      return null;
    }
  }, [statusImage, isAvatar, showAlwaysRoomInfo, statusMessage, id, roomSelectedItem]);

  return (
    <React.Fragment>
      <div className={styles.positionWrapper}>
        <div className={styles.absoluteDiv} ref={ref}>
          <Status />
        </div>
      </div>

      {roomSelectedItem?.id === id && roomSelectedItem.type === 'FIGURE' && <React.Fragment>
        
          <InputText type={'text'} onClick={()=> setShowComment(true)} className={styles.comment} />
          <CircleButton size={'l'} className={styles.like} onClick={handleToggleLike}>
              {isLiked? <Icon name={"Heart_S_On"}/> : <Icon name={"Heart_S"}/>}
          </CircleButton>

          <CommentOffCanvas isOpen={showComment} targetId={feedId} targetProfileId={profileId} onClose={()=> setShowComment(false)} />
      </React.Fragment>}
    </React.Fragment>
  );
};

export default AvatarStatusMessage;
