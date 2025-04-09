import { atom } from "jotai";
import { RoomInfo, SelectedItem } from "./type";
import { IAssetManifest_MyRoom } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";



/**
 * 
 */
export const currentRoomInfoAtom = atom<RoomInfo>(null);



export const hideRoomPlaceUIAtom = atom<boolean>(false);


export const meRoomManifestAtom = atom<IAssetManifest_MyRoom | null>(null);

/**
 * 
 */
export const roomBackgroundColorAtom = atom<string | undefined>(undefined);

export const roomSelectedItemAtom = atom<SelectedItem | null>(null);

export const recommendFiguresIdsAtom = atom<string[]>([]);