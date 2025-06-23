import * as BABYLON from '@babylonjs/core';
import { atom } from 'jotai';
import { Observable } from '@babylonjs/core/Misc/observable';
import { IIconSetting } from '../types';
import { ItemModelIconGenerator } from '../itemModelIconGenerator';
import { LockObject } from 'client-tools-ui-components/tabs/propertyGrids/lockObject';

/**  LogWindow 메세지 */
export const logWindowMessageDataAtom = atom<string[]>([]);

/**  Icon Setting */
export const iconSettingAtom = atom<IIconSetting>({ fov: 45, alpha: ItemModelIconGenerator.DEFAULT_ITEM_CAM_ALPHA, beta: ItemModelIconGenerator.DEFAULT_ROOM_CAM_BETA, radius: ItemModelIconGenerator.DEFAULT_ROOM_CAM_RADIUS, lookTarget: ItemModelIconGenerator.DEFAULT_ROOM_CAM_TARGET, iconSize: 256 });
export const iconSettingLockObjectAtom = atom<LockObject>(new LockObject);