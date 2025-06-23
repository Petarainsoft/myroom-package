import { atom } from 'jotai';
// import { EFigureShowcaseTab } from './FigureShowcaseContent';

export enum EFigureShowcaseTab {
  CARD,
  FEED,
}

export const figureShowcaseTabAtom = atom(EFigureShowcaseTab.CARD);
export const placedFigureProfileIdsAtom = atom<string[] | null>(null);
