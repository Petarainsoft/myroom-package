import { ModalProps } from '@/components/_core/ModalCore';

export type TMenuType = 'recommend' | 'follower' | 'following';
export type TActionType = 'recommendUser' | 'refresh' | undefined;

export interface IFollowFullScreenModal extends Omit<ModalProps, 'onRequestClose'> {
  isMine: boolean;
  profileId: string;
  selectedMenu: TMenuType;
}

export interface UserElementProps {
  profile: { _id: string }
}