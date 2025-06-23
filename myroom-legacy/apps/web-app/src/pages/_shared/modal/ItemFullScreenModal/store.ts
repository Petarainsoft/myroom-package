import { IMyRoomItemFunctionData } from 'client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom';
import { atom } from 'jotai';

export const itemFunctionDataAtom = atom<IMyRoomItemFunctionData | null>(null);

/**View 관련 */
//오픈그래프 OffCanvas
export const isOpenLinkPreviewAtom = atom<boolean>(false);
export const memoTextAtom = atom<string>('');
