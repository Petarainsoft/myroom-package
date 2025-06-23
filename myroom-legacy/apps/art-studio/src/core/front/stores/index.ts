import { atom } from 'jotai';
import { GlobalState } from '../../../components/globalState';
import { IItemExplorerDatas } from '@/components/ItemExplorer/itemExplorerComponent';


/** EquipEditor 모드에서 사용하는 state */
export interface IEquipState {
    skeleton: string;
    animation: string[];
    equipment: { slot: string, item: string; }[];
    customization: {
        hairColor: string;
        skinColor: string;
    };

}

/**  LogWindow 메세지 */
export const logWindowMessageDataAtom = atom<string[]>([]);

/** TreeView Global State */
export const globalStateAtom = atom<GlobalState>(new GlobalState());
export const itemExplorerDataAtom = atom<IItemExplorerDatas>({ itemName: "", meshes: [], materials: [], textures: [] });
export const equipStateAtom = atom<IEquipState>({ skeleton: "", animation: [], equipment: [], customization: { hairColor: "", skinColor: "" } });


