import * as BABYLON from "@babylonjs/core";
import { eGridNormal } from "../../definitions";
import { IRoomGridInfo, IMyRoomPlacementInfo, IGridMark } from "../../jsonTypes/manifest/assetManifest_MyRoom";
import { Grid } from "./GridManager_Grid";
import { ItemPlacementManager } from "./ItemPlacementManager";
import { EPlacementAttachType } from "../../../tableData/defines/System_Enum";


//---------------------------------------------------------------------------------------
// IFindValidPostionResult
//---------------------------------------------------------------------------------------
export interface IFindValidPositionResult {
    success: boolean,
    grid: Grid | null,
    fromX: number,
    toX: number,
    fromY: number,
    toY: number,
    rotateToFit: boolean,
}

//---------------------------------------------------------------------------------------
// IRoomMeshInfo
//---------------------------------------------------------------------------------------
export interface IRoomMeshInfo {
    mesh: BABYLON.AbstractMesh,
    gridInfo: IRoomGridInfo,
}

//---------------------------------------------------------------------------------------
// GridPickingInfo
//---------------------------------------------------------------------------------------
export interface IGridPickingInfo {
    hitGrid: Grid | null,
    hitPos: BABYLON.Vector3,
    hitCellPosX: number,
    hitCellPosY: number,
}

//---------------------------------------------------------------------------------------
// GridManager
//---------------------------------------------------------------------------------------
export class GridManager {
    private _owner: ItemPlacementManager;
    private _scene: BABYLON.Scene;
    private _allGrids = new Map<string, Grid>();

    private _allPlacedItems: Map<string, string> = new Map<string, string>(); //(instance id, 배치된 gridName)
    private _allPlacedFigrues: Map<string, string> = new Map<string, string>(); //(figure id, 배치된 gridName)


    private _debugMode: boolean = false;
    private _roomMeshHolder: BABYLON.TransformNode;

    public getGridPickingMeshHolder(): BABYLON.TransformNode {
        return this._roomMeshHolder;
    }

    constructor(owner: ItemPlacementManager, scene: BABYLON.Scene) {
        this._owner = owner;
        this._scene = scene;
        this._roomMeshHolder = new BABYLON.TransformNode("[Room Picking Meshes (for Grid)]", this._scene);
        this._roomMeshHolder.parent = this._owner.getOwner();
    }

    public finalize() {
        this._allGrids.forEach((v) => { v.dispose(); });
        this._allGrids.clear();

        this._allPlacedItems.clear();
        this._allPlacedFigrues.clear();
    }

    public initialize(roomMeshInfos: IRoomMeshInfo[]) {
        roomMeshInfos.forEach((info) => {
            const placementType = this._convertTextToPlacementType(info.gridInfo.placementType);
            const gridNormal = this._convertTextToGridNormal(info.gridInfo.gridNormal);
            this.addNewGrid(info.gridInfo.meshName, placementType, gridNormal, info.mesh, info.gridInfo.width, info.gridInfo.height, BABYLON.Vector3.FromArray(info.gridInfo.gridOrigin), info.gridInfo.markArray);
            if (info.gridInfo.isFloor) {
                this.addNewGrid(info.gridInfo.meshName + "_Carpet", EPlacementAttachType.Carpet, gridNormal, info.mesh, info.gridInfo.width, info.gridInfo.height, BABYLON.Vector3.FromArray(info.gridInfo.gridOrigin), info.gridInfo.markArray);
            }
        });
    }

    public addNewGrid(name: string, placementType: EPlacementAttachType, gridNormal: eGridNormal, ownerNode: BABYLON.TransformNode, width: number, height: number, gridOrigin: BABYLON.Vector3, maskArray: IGridMark[]) {
        if (!this._allGrids.has(name)) {
            const grid = new Grid(this, name, placementType, gridNormal, ownerNode, width, height, gridOrigin, maskArray);
            grid.createPickingMesh(this._scene, this._debugMode);
            this._allGrids.set(name, grid);
        }
        else {
            console.error(`RoomGrid.addNewGrid() => already in same name grid!! (${name})`);
        }
    }

    public findEmptyPosition(placementType: EPlacementAttachType, sw: number, sh: number): IFindValidPositionResult {
        const result: IFindValidPositionResult = {
            success: false,
            grid: null,
            fromX: 0,
            toX: 0,
            fromY: 0,
            toY: 0,
            rotateToFit: false
        };

        if (placementType === EPlacementAttachType.Floor) {
            this._findEmptyPosition_Floor(sw, sh, result);
        }
        else if (placementType === EPlacementAttachType.Wall) {
            this._findEmptyPosition_Wall(sw, sh, result);
        }
        else if (placementType === EPlacementAttachType.Desk) {
            this._findEmptyPosition_Desk(sw, sh, result);
        }
        else if (placementType === EPlacementAttachType.Carpet) {
            this._findEmptyPosition_Carpet(sw, sh, result);
        }

        return result;
    }

    public findBestPostion(ray: BABYLON.Ray, placementTypes: EPlacementAttachType[], w: number, h: number): IFindValidPositionResult {
        const result: IFindValidPositionResult = {
            success: false,
            grid: null,
            fromX: 0,
            toX: 0,
            fromY: 0,
            toY: 0,
            rotateToFit: false
        };

        const allPickingInfos = this.pickAllGrids(ray, placementTypes);

        //BABYLON.RayHelper.CreateAndShow(ray, this._scene, BABYLON.Color3.Green());
        const canRotate = placementTypes.findIndex(v => v === EPlacementAttachType.Desk) < 0;
        for (let ii = 0; ii < allPickingInfos.length; ++ii) {
            const grid = allPickingInfos[ii].hitGrid;
            if (grid) {
                grid.findBestPosition(allPickingInfos[ii].hitCellPosX, allPickingInfos[ii].hitCellPosY, w, h, result, canRotate);
                if (result.success) {
                    break;
                }
            }
        }

        return result;
    }


    public placeItem(gridName: string, itemInstanceId: string, fromX: number, toX: number, fromY: number, toY: number): boolean {
        if (this._allGrids.has(gridName)) {
            if (!this._allPlacedItems.has(itemInstanceId)) {
                const grid = this._allGrids.get(gridName);
                grid!.placeItem(itemInstanceId, fromX, toX, fromY, toY);
                this._allPlacedItems.set(itemInstanceId, gridName);
                return true;
            }
            else {
                console.error("GridManager.placeItem() => duplicated item instance id... check!!!");
            }
        }
        else {
            console.error(`GridManager.placeItem() => could not find name matched grid.. ${gridName}`);
        }

        return false;
    }

    public removeItem(itemInstanceId: string, removeGrid: boolean) {
        const gridName = this._allPlacedItems.get(itemInstanceId);
        if (gridName) {
            const grid = this._allGrids.get(gridName);
            if (grid) {
                grid.removeItem(itemInstanceId);
            }
        }

        this._allPlacedItems.delete(itemInstanceId);

        //그리드를 가지고 있는 아이템의 이동중 일 경우 Grid를 제거하지 않는다.
        if (removeGrid) {
            this.removeGrid(itemInstanceId);
        }
    }

    public removeGrid(gridName: string) {
        const grid: Grid | undefined = this._allGrids.get(gridName);
        if (grid) {
            grid.dispose();
            this._allGrids.delete(gridName);
        }
    }

    public isAlreadyPlaced(figureId: string) {
        return this._allPlacedFigrues.has(figureId);
    }

    public placeFigure(gridName: string, figureId: string, fromX: number, toX: number, fromY: number, toY: number) {
        if (this._allGrids.has(gridName)) {
            if (!this.isAlreadyPlaced(figureId)) {
                const grid = this._allGrids.get(gridName);
                grid!.placeFigure(figureId, fromX, toX, fromY, toY);
                this._allPlacedFigrues.set(figureId, gridName);
            }
            else {
                console.error("GridManager.placeFigure() => duplicated figure id... check!!!");
            }
        }
        else {
            console.error(`GridManager.placeFigure() => could not find name matched grid.. ${gridName}`);
        }
    }

    public removeFigure(figureId: string) {
        const gridName = this._allPlacedFigrues.get(figureId);
        if (gridName) {
            const grid = this._allGrids.get(gridName);
            if (grid) {
                grid.removeFigure(figureId);
            }
        }

        this._allPlacedFigrues.delete(figureId);
    }

    public calucateAbsoltePostion(gridName: string, xFrom: number, xTo: number, yFrom: number, yTo: number, oPos: BABYLON.Vector3): boolean {
        const grid = this._allGrids.get(gridName);
        if (grid) {
            return grid.calculateAbsolutePostion(xFrom, xTo, yFrom, yTo, oPos);
        }
        else {
            console.error(`GridManager.calucateAbsoltePostion() : no grid ${gridName}`);
        }
        return false;
    }

    public getItemGridName(instanceId: string): string {
        const gridName = this._allPlacedItems.get(instanceId);
        return gridName || "";
    }

    public getItemPlacementInfo(instanceId: string): IMyRoomPlacementInfo | undefined {
        const gridName = this._allPlacedItems.get(instanceId);
        if (gridName) {
            const grid = this._allGrids.get(gridName);
            if (grid) {
                return grid.getItemPlacementInfo(instanceId);
            }
        }
        return undefined;
    }

    public getFigurePlacementInfo(figureId: string): IMyRoomPlacementInfo | undefined {
        const gridName = this._allPlacedFigrues.get(figureId);
        if (gridName) {
            const grid = this._allGrids.get(gridName);
            if (grid) {
                return grid.getFigurePlacementInfo(figureId);
            }
            else {
                console.error(`GridManager.getFigurePlacementInfo() => no grid ,${gridName}`);
            }
        }
        console.error(`GridManager.getFigurePlacementInfo() => no gridName ,${gridName}`);
        return undefined;
    }

    public getGridByName(name: string): Grid | undefined {
        return this._allGrids.get(name);
    }

    public pickGrid(ray: BABYLON.Ray, placementTypes: EPlacementAttachType[]): IGridPickingInfo {
        let hitDistance: number = Number.MAX_VALUE;
        let hitGrid: Grid | null = null;
        let hitPos: BABYLON.Vector3 = new BABYLON.Vector3();
        let hitCellPosX: number = 0;
        let hitCellPosY: number = 0;

        //BABYLON.RayHelper.CreateAndShow(ray, this._scene, BABYLON.Color3.Red());
        this._allGrids.forEach((grid) => {
            if (placementTypes.findIndex((v) => v === grid.getPlacementType()) >= 0) {
                const gridMesh = grid.getPickingMesh();
                if (gridMesh) {
                    const hitResult = ray.intersectsMesh(gridMesh);
                    if (hitResult.hit && hitResult.distance < hitDistance) {
                        hitDistance = hitResult.distance;
                        hitGrid = grid;
                        hitPos.copyFrom(hitResult.pickedPoint!);
                        const hitCellPos = grid.convertWorldPosToCellPos(hitPos);
                        hitCellPosX = hitCellPos.x;
                        hitCellPosY = hitCellPos.y;
                    }
                }
            }
        });

        const pickInfo: IGridPickingInfo = {
            hitGrid,
            hitPos,
            hitCellPosX,
            hitCellPosY,
        };

        return pickInfo;
    }

    public pickAllGrids(ray: BABYLON.Ray, placementTypes: EPlacementAttachType[]): IGridPickingInfo[] {
        const result: IGridPickingInfo[] = [];
        this._allGrids.forEach((grid) => {
            if (placementTypes.findIndex((v) => v === grid.getPlacementType()) >= 0) {
                const gridMesh = grid.getPickingMesh();
                if (gridMesh) {
                    const hitResult = ray.intersectsMesh(gridMesh);
                    if (hitResult.hit) {
                        const hitCellPos = grid.convertWorldPosToCellPos(hitResult.pickedPoint!);
                        result.push({
                            hitGrid: grid,
                            hitPos: new BABYLON.Vector3().copyFrom(hitResult.pickedPoint!),
                            hitCellPosX: hitCellPos.x,
                            hitCellPosY: hitCellPos.y
                        });
                    }
                }
            }
        });

        //sorting해서 넘긴다
        result.sort((a, b) => {
            const distA = BABYLON.Vector3.DistanceSquared(a.hitPos, ray.origin);
            const distB = BABYLON.Vector3.DistanceSquared(b.hitPos, ray.origin);
            if (distA < distB) {
                return -1;
            }
            else if (distA > distB) {
                return 1;
            }
            else {
                return 0;
            }
        });

        return result;
    }

    public pick(x: number, y: number, placementTypes: EPlacementAttachType[]): IGridPickingInfo {
        const ray = this._scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), null);
        //BABYLON.RayHelper.CreateAndShow(ray, this._scene, BABYLON.Color3.Green());
        return this.pickGrid(ray, placementTypes);
    }

    public isEmptyArea(gridName: string, fromX: number, toX: number, fromY: number, toY: number): boolean {
        if (this._allGrids.has(gridName)) {
            const grid = this._allGrids.get(gridName);
            return grid!.isEmptyArea(fromX, toX, fromY, toY);
        }

        return false;
    }

    public showGridMeshes(show: boolean) {
        this._allGrids.forEach((grid) => {
            grid.showGridMesh(show);
        });
    }

    //-----------------------------------------------------------------------------------
    // findValidPosition Helpers
    //-----------------------------------------------------------------------------------
    private _findEmptyPosition_Floor(sw: number, sh: number, result: IFindValidPositionResult) {
        const grids = this._findAllGridsByPlacementType(EPlacementAttachType.Floor);
        grids.forEach((grid) => {
            grid.findValidPosition(sw, sh, result, true);
            if (result.success) {
                return;
            }
        });
    }

    private _findEmptyPosition_Wall(sw: number, sh: number, result: IFindValidPositionResult) {
        const grids = this._findAllGridsByPlacementType(EPlacementAttachType.Wall);
        grids.forEach((grid) => {
            grid.findValidPosition(sw, sh, result, false);
            if (result.success) {
                return;
            }
        });
    }

    private _findEmptyPosition_Desk(sw: number, sh: number, result: IFindValidPositionResult) {
        //Desk
        let grids = this._findAllGridsByPlacementType(EPlacementAttachType.Desk);
        grids.forEach((grid) => {
            grid.findValidPosition(sw, sh, result, true);
            if (result.success) {
                return;
            }
        });


        //바닥
        grids = this._findAllGridsByPlacementType(EPlacementAttachType.Floor);
        grids.forEach((grid) => {
            grid.findValidPosition(sw, sh, result, true);
            if (result.success) {
                return;
            }
        });
    }

    private _findEmptyPosition_Carpet(sw: number, sh: number, result: IFindValidPositionResult) {
        const grids = this._findAllGridsByPlacementType(EPlacementAttachType.Carpet);
        grids.forEach((grid) => {
            grid.findValidPosition(sw, sh, result, true);
            if (result.success) {
                return;
            }
        });
    }

    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------
    private _findAllGridsByPlacementType(placementType: EPlacementAttachType): Array<Grid> {
        const result = new Array<Grid>();
        this._allGrids.forEach((v) => {
            if (v.getPlacementType() === placementType) {
                result.push(v);
            }
        });

        return result;
    }

    private _convertTextToGridNormal(text: string): eGridNormal {
        if (text === "X") {
            return eGridNormal.X;
        }
        else if (text === "Y") {
            return eGridNormal.Y;
        }
        else if (text === "Z") {
            return eGridNormal.Z;
        }

        return eGridNormal.Y;
    }

    private _convertTextToPlacementType(text: string): EPlacementAttachType {
        if (text === "Floor") {
            return EPlacementAttachType.Floor;
        }
        else if (text === "Wall") {
            return EPlacementAttachType.Wall;
        }
        else if (text === "Desk") {
            return EPlacementAttachType.Desk;
        }
        else if (text === "Carpet") {
            return EPlacementAttachType.Carpet;
        }

        return EPlacementAttachType.Floor;
    }

    //-----------------------------------------------------------------------------------
    // static utils
    //-----------------------------------------------------------------------------------
    public static convertNumberArrayToGridMarkArray(numArray: number[]): IGridMark[] {
        const retVal: IGridMark[] = [];
        for (let ii = 0; ii < (numArray.length % 4); ++ii) {
            const fromX = numArray[ii * 4];
            const toX = numArray[ii * 4 + 1];
            const fromY = numArray[ii * 4 + 2];
            const toY = numArray[ii * 4 + 3];
            retVal.push({ fromX, toX, fromY, toY });
        }

        return retVal;
    }
}