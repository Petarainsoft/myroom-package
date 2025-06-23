import { IAssetManifest } from "./assetManifest";
import { EMediaType, ePlacementRotationType } from "../../definitions";

export interface IGridMark {
    fromX: number,
    toX: number,
    fromY: number,
    toY: number;
}

export interface IRoomGridInfo {
    meshName: string,
    isFloor: boolean,
    placementType: string,
    gridNormal: string,
    width: number,
    height: number,
    gridOrigin: number[],
    markArray: IGridMark[],
}

export interface IMyRoomPlacementInfo {
    gridName: string,
    fromX: number,
    toX: number,
    fromY: number,
    toY: number,
    rot: ePlacementRotationType,
}

export interface IMyRoomItemPlacementInfo {
    itemId: string,
    instanceId: string,
    parentId: string,
    placeInfo: IMyRoomPlacementInfo;
}

export interface IMyRoomFigurePlacementInfo {
    avatarId: string,
    isAvatar: boolean,
    parentId: string,
    placeInfo: IMyRoomPlacementInfo;
}

export interface IMyRoomItemFunctionData {
    instanceId: string,
    linkUrl?: string,
    linkAlias?: string;
    functionData?: string,
    mediaType?: EMediaType, //EFunctionType.LINKANDMEDIA 때문에 타입구분 필요하다
}

export interface IAssetManifest_MyRoom extends IAssetManifest {
    format: number,
    main:
    {
        type: string,

        room: {
            backgroundColor: string,
            roomSkinId: string,
            grids: IRoomGridInfo[],
        },

        items?: IMyRoomItemPlacementInfo[],
        figures?: IMyRoomFigurePlacementInfo[],
        itemFunctionDatas?: IMyRoomItemFunctionData[],
        environment?: string,
        defaultAvatarPos: IMyRoomPlacementInfo;
    },
    testItems?: string[];
}

// 우선은 avatarId만 있어도 되는데, 혹시나 다른 정보가 필요할지 몰라서, object로 처리
export interface IOutsideFigureInfo {
    avatarId: string,
}