import { atom } from "jotai";


export type AvatarInfoStatus = 'MAIN' | 'CUSTOM' | 'EDIT_STATUS';

export const avatarInfoStatusAtom = atom<AvatarInfoStatus>('MAIN');
export const currentEquipItemsAtom = atom<string[]>([]);

