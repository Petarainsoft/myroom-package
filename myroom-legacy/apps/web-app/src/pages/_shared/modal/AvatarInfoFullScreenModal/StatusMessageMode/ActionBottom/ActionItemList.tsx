import style from './style.module.scss';
import { useAtom } from 'jotai';
import {
  actionStepAtom,
  editedStatusActionIdAtom,
  statusActionIdAtom,
} from '@/common/stores';
import { useEffect, useRef } from 'react';
import useItemAPI from '@/apis/Meta/Item';
import Image from '@/components/Image';
import { AvatarManager } from '@/common/factories/avatar';
import { DEFAULT_ACTION_ID } from '@/common/constants/avatar';

// import { logger } from '@/common/utils/logger';

interface IActionList {
  activeActionCategory: number;
}
const WORLD_ID = '1mkSuyvWsZAZKE2cuDzmzI';

const ActionItemList = ({ activeActionCategory }: IActionList) => {
  const [editedStatusActionId, setEditedStatusActionId] = useAtom(
    editedStatusActionIdAtom,
  );
  const [actionStep] = useAtom(actionStepAtom);
  const [statusActionId, setStatusActionId] = useAtom(statusActionIdAtom);

  const actionListRef = useRef<HTMLDivElement>(null);

  const { fetchItems } = useItemAPI();

  //카테고리에 해당하는 액션 아이템 불러오기
  const { data, isLoading } = fetchItems({
    w: WORLD_ID,
    category: activeActionCategory.toString(),
  });

  const handleAction = (actionId: string) => () => {
    console.log('ACTIONTEST', actionId);
    if (actionId !== editedStatusActionId) {
      AvatarManager.getAPI.playAnimation(actionId, actionStep);
      setEditedStatusActionId(actionId);
      return;
    }
  };

  const isActiveItem = (actionId: string) => {
    if (!editedStatusActionId && statusActionId == actionId) {
      return true;
    }
    return editedStatusActionId === actionId;
  };
  //스크롤바 상단 이동
  useEffect(() => {
    actionListRef.current!.scrollTop = 0;
  }, [activeActionCategory]);

  useEffect(() => {
    if (isLoading || !data) return;
    //서버에 저장된 액션ID가 없을 때 첫번째 카테고리의 첫번째 액션 아이템
    if (!!!statusActionId) {
      setStatusActionId(DEFAULT_ACTION_ID);
      setEditedStatusActionId(DEFAULT_ACTION_ID);
      //messageClient.postMessage('W2C-avatarStatus-action', DEFAULT_ACTION_ID);
    }
  }, [data]);

  useEffect(() => {
    if (!editedStatusActionId) return;
    AvatarManager.getAPI.playAnimation(editedStatusActionId, actionStep);
  }, [actionStep]);

  return (
    <div className={style.actionItemListWrapper} ref={actionListRef}>
      <div className={style.actionItemList}>
        {data?.list.map((item) => (
          <div
            key={item._id}
            className={`${style.actionItem} ${
              isActiveItem(item._id) ? style.active : ''
            }`}
            onClick={handleAction(item._id)}
          >
            <Image src={item.resource.thumbnail} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionItemList;
