import { EPriceType } from 'client-core';

export interface IAlertPopup {
  titleText?: string | JSX.Element | JSX.Element[];
  contentText?: string | JSX.Element | JSX.Element[];
  confirmText?: string | JSX.Element | JSX.Element[];
}
export interface IAPIErrorPopup {
  titleTextId?: string;
  titleText?: string | JSX.Element | JSX.Element[];
  errorText?: string;
}

export interface IConfirmPopup {
  titleText?: string | JSX.Element | JSX.Element[];
  contentText?: string | JSX.Element | JSX.Element[];
  confirmText?: string | JSX.Element | JSX.Element[];
  cancelText?: string | JSX.Element | JSX.Element[];
  onConfirm?: (...rest: any) => Promise<void> | void;
}

export interface IToastPopup {
  titleText?: string | JSX.Element | JSX.Element[];
}
export interface IGoodsPopup {
  priceType: EPriceType;
  contentText?: string | JSX.Element | JSX.Element[];
  cancelText?: string | JSX.Element | JSX.Element[];
  confirmText?: string | JSX.Element | JSX.Element[];
  onConfirm?: () => void;
  onCancel?: () => void;
}

export type TSheetType =
  | 'RESIZE_BOT'
  | 'COVER_TOP'
  | 'COVER_RIGHT'
  | 'COVER_BOT'
  | 'COVER_LEFT';
export type TSizeMode = 'COLLAPSED' | 'DEFAULT';

export type THeader = 'SKIN' | 'ITEM' | 'FIGURE';
export type TMyCategory =
  | 'COORDI-MY'
  | 'COORDI-RCM'
  | 'SKIN-MY'
  | 'SKIN-FAV'
  | 'ITEM-MY'
  | 'ITEM-FAV'
  | '';

export type TSort = 'all' | 'n' | 'fp' | 'f';
export type TSavePurchase = 'P' | 'S';

export interface IAvatarInfoMap {
  [key: string]: {
    profileId: string;
    version: number;
  };
}
export interface IStatusImage {
  file: File;
  fileUrl: string;
}

export type TStatusActionStep = '_01' | '_02';

export type TFollowTabType = 'recommend' | 'follower' | 'following' | '';
