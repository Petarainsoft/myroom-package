import * as BABYLON from "@babylonjs/core";
import { Constants } from "../../constants";
import { eGridNormal, ePlacementRotationType } from "../../definitions";
import { IGridMark, IMyRoomPlacementInfo } from "../../jsonTypes/manifest/assetManifest_MyRoom";
import { GridManager, IFindValidPositionResult } from "./GridManager";
import { Cell } from "./GridManager_Cell";
import { EPlacementAttachType } from "../../../tableData/defines/System_Enum";

export class Grid {
    private _owner: GridManager;
    private _name: string;
    private _placementType: EPlacementAttachType;
    private _gridNormal: eGridNormal;
    private _widthUnits;
    private _heightUnits;
    private _gridMarkArray: IGridMark[];
    private _cells: Array<Cell>;
    private _ownerNode: BABYLON.TransformNode; //Mesh 이거나 ItemController
    private _gridOrigin: BABYLON.Vector3;


    private _pickingMesh: BABYLON.Mesh | null = null;

    public getName(): string {
        return this._name;
    }

    public getPlacementType(): EPlacementAttachType {
        return this._placementType;
    }

    public getGridNormal(): eGridNormal {
        return this._gridNormal;
    }

    public getGridMarkArray(): IGridMark[] {
        return this._gridMarkArray;
    }

    public getOwnerNode(): BABYLON.TransformNode {
        return this._ownerNode;
    }

    public getWidthUnits() {
        return this._widthUnits;
    }

    public getHeightUnits() {
        return this._heightUnits;
    }

    public getGridOrigin() {
        return this._gridOrigin;
    }

    public getPickingMesh(): BABYLON.Mesh | null {
        return this._pickingMesh;
    }

    public constructor(owner: GridManager, name: string, placementType: EPlacementAttachType, gridNormal: eGridNormal, ownerMesh: BABYLON.TransformNode, widthUnit: number, heightUnit: number, gridOrigin: BABYLON.Vector3, markArray: IGridMark[]) {
        this._owner = owner;
        this._name = name;
        this._placementType = placementType;
        this._gridNormal = gridNormal;
        this._ownerNode = ownerMesh;
        this._widthUnits = widthUnit;
        this._heightUnits = heightUnit;
        this._gridMarkArray = markArray;
        this._gridOrigin = gridOrigin;
        this._cells = new Array<Cell>();
        for (let y = 0; y < this._heightUnits; ++y) {
            for (let x = 0; x < this._widthUnits; ++x) {
                let isMarked = false;
                if (markArray) {
                    markArray.forEach((mark) => {
                        if (x >= mark.fromX && x <= mark.toX && y >= mark.fromY && y <= mark.toY) {
                            isMarked = true;
                        }
                    });
                }
                this._cells.push(new Cell(this, isMarked));
            }
        }

        if (this._widthUnits % 2 != 0 || this._heightUnits % 2 != 0) {
            console.error("Grid.constructor() => width or height is not even!!"); //convertWorldPosToCellPos 에서 문제 생길수 있다 check!!
        }
    }

    public placeItem(itemInstanceId: string, fromX: number, toX: number, fromY: number, toY: number) {
        for (let x = Math.floor(fromX); x <= Math.floor(toX); ++x) {
            for (let y = Math.floor(fromY); y <= Math.floor(toY); ++y) {
                const cell = this._getCell(x, y);
                if (cell) {
                    cell.setPlacedItemInstanceId(itemInstanceId);
                }
            }
        }
    }

    public dispose() {
        this._pickingMesh?.dispose();
    }

    public removeItem(itemInstanceId: string) {
        this._cells.forEach(c => {
            if (c.getPlacedItemInstanceId() === itemInstanceId) {
                //console.log("item removed!!!", itemInstanceId);
                c.setPlacedItemInstanceId("");
            }
        });
    }

    public getItemPlacementInfo(itemInstanceId: string): IMyRoomPlacementInfo | undefined {
        let minX = Number.MAX_VALUE;
        let maxX = -1;
        let minY = Number.MAX_VALUE;
        let maxY = -1;

        for (let idx = 0; idx < this._cells.length; ++idx) {
            if (this._cells[idx].getPlacedItemInstanceId() === itemInstanceId) {
                const x = Math.floor(idx % this._widthUnits);
                const y = Math.floor(idx / this._widthUnits);

                if (minX > x) {
                    minX = x;
                }

                if (maxX < x) {
                    maxX = x;
                }

                if (minY > y) {
                    minY = y;
                }

                if (maxY < y) {
                    maxY = y;
                }
            }
        }

        if (minX >= 0 && minX < this._widthUnits && maxX >= 0 && maxX < this._widthUnits &&
            minY >= 0 && minY < this._heightUnits && maxY >= 0 && maxY < this._heightUnits) {
            return {
                gridName: this._name,
                fromX: minX,
                toX: maxX,
                fromY: minY,
                toY: maxY,
                rot: ePlacementRotationType.Rot_0
            };
        }

        return undefined;
    }

    public getFigurePlacementInfo(figureId: string): IMyRoomPlacementInfo | undefined {
        let minX = Number.MAX_VALUE;
        let maxX = -1;
        let minY = Number.MAX_VALUE;
        let maxY = -1;

        for (let idx = 0; idx < this._cells.length; ++idx) {
            if (this._cells[idx].getPlacedFigureId() === figureId) {
                const x = Math.floor(idx % this._widthUnits);
                const y = Math.floor(idx / this._widthUnits);

                if (minX > x) {
                    minX = x;
                }

                if (maxX < x) {
                    maxX = x;
                }

                if (minY > y) {
                    minY = y;
                }

                if (maxY < y) {
                    maxY = y;
                }
            }
        }

        if (minX >= 0 && minX < this._widthUnits && maxX >= 0 && maxX < this._widthUnits &&
            minY >= 0 && minY < this._heightUnits && maxY >= 0 && maxY < this._heightUnits) {
            return {
                gridName: this._name,
                fromX: minX,
                toX: maxX,
                fromY: minY,
                toY: maxY,
                rot: ePlacementRotationType.Rot_0
            };
        }

        return undefined;

    }

    public placeFigure(figureId: string, fromX: number, toX: number, fromY: number, toY: number) {
        for (let x = Math.floor(fromX); x <= Math.floor(toX); ++x) {
            for (let y = Math.floor(fromY); y <= Math.floor(toY); ++y) {
                const cell = this._getCell(x, y);
                if (cell) {
                    cell.setPlacedFigureId(figureId);
                }
                else {
                    console.error(`Grid.placeFigure() ==> no cell, x=${x}, y=${y}`);
                }
            }
        }
    }

    public removeFigure(figureId: string) {
        this._cells.forEach(c => {
            if (c.getPlacedFigureId() === figureId) {
                c.setPlacedFigureId("");
            }
        });
    }

    public findValidPosition(sw: number, sh: number, result: IFindValidPositionResult, canRotate: boolean = false) {
        this._findValidPosition(sw, sh, result);
        if (canRotate && !result.success) {
            result.rotateToFit = true;
            this._findValidPosition(sh, sw, result);
        }
    }

    public findBestPosition(x: number, y: number, sw: number, sh: number, result: IFindValidPositionResult, canRotate: boolean = false) {
        this._findBestPosition(x, y, sw, sh, result);
        if (canRotate && !result.success) {
            result.rotateToFit = true;
            this._findBestPosition(x, y, sw, sh, result);
        }
    }


    public isEmptyArea(fromX: number, toX: number, fromY: number, toY: number): boolean {
        return this._checkAreaEmpty(fromX, fromY, toX - fromX + 1, toY - fromY + 1);
    }

    public calculateAbsolutePostion(fromX: number, toX: number, fromY: number, toY: number, _oPos: BABYLON.Vector3): boolean {
        const lb = new BABYLON.Vector3();
        const rb = new BABYLON.Vector3();
        const lt = new BABYLON.Vector3();
        const rt = new BABYLON.Vector3();

        if (this._calculateCellPos(fromX, fromY, lb) && this._calculateCellPos(fromX, toY + 1, lt) && this._calculateCellPos(toX + 1, fromY, rb) && this._calculateCellPos(toX + 1, toY + 1, rt)) {
            _oPos.copyFrom(new BABYLON.Vector3((lb.x + rb.x + lt.x + rt.x) * 0.25, (lb.y + rb.y + lt.y + rt.y) * 0.25, (lb.z + rb.z + lt.z + rt.z) * 0.25));
            //console.log(`lb = ${lb} rb = ${rb} lt =${lt} rt=${rt}`); //영역의 Center가 나온다.
            return true;
        }

        return false;
    }

    public createPickingMesh(pickingScene: BABYLON.Scene, debugMode: boolean) {
        const width = this.getWidthUnits() * Constants.MYROOM_GRID_UNIT_SIZE;
        const height = this.getHeightUnits() * Constants.MYROOM_GRID_UNIT_SIZE;
        this._pickingMesh = BABYLON.MeshBuilder.CreatePlane(`${this.getName()}`, { width, height, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, pickingScene);
        this._pickingMesh.parent = this._owner.getGridPickingMeshHolder();
        if (!debugMode) {
            this._pickingMesh.visibility = 0;
        }
        this._pickingMesh.isPickable = false; //picking 메쉬때문에 상단에 올리는 아이템 피킹이 않된다. 그래서 제거!! 배치하는데는 문제 없음..

        this._pickingMesh.computeWorldMatrix();
        this.updatePickingMeshPosition();

        this._ownerNode.getScene().registerBeforeRender(() => { this.updatePickingMeshPosition(); }); //책상이 회전할경우 메쉬 같이 맞춰 줘야한다.
    }

    public updatePickingMeshPosition() {
        if (this._pickingMesh) {
            this._pickingMesh.setAbsolutePosition(BABYLON.Vector3.TransformCoordinates(this.getGridOrigin(), this.getOwnerNode().getWorldMatrix()));

            //rot 맞추기
            if (this.getGridNormal() == eGridNormal.Y) {
                const objectRot = this.getOwnerNode().absoluteRotationQuaternion.toEulerAngles();
                this._pickingMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(180 + BABYLON.Tools.ToDegrees(objectRot.y)), 0); //오브젝트 회전 추가 해야한다
            }
            else if (this.getGridNormal() == eGridNormal.X) {
                this._pickingMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(270), 0);
            }
            else if (this.getGridNormal() == eGridNormal.Z) {
                this._pickingMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(180), 0);
                this._pickingMesh.scaling = new BABYLON.Vector3(1, 1, -1);
            }

            this._pickingMesh.computeWorldMatrix();
        }
    }

    public convertWorldPosToCellPos(pos: BABYLON.Vector3): { x: number; y: number; } {
        const matToGrid = this._pickingMesh!.getWorldMatrix().clone();
        matToGrid.invert();

        const gridPos = BABYLON.Vector3.TransformCoordinates(pos, matToGrid);
        const posX = Math.floor(gridPos.x / Constants.MYROOM_GRID_UNIT_SIZE) + Math.floor(this.getWidthUnits() * 0.5);
        const posY = Math.floor(gridPos.y / Constants.MYROOM_GRID_UNIT_SIZE) + Math.floor(this.getHeightUnits() * 0.5);
        return { x: posX, y: posY };
    };

    public showGridMesh(bShow: boolean) {
        if (this._pickingMesh) {
            this._pickingMesh.visibility = bShow ? 1 : 0;
        }
    }

    //-----------------------------------------------------------------------------------
    // private Helpers
    //-----------------------------------------------------------------------------------
    private _findValidPosition(sw: number, sh: number, result: IFindValidPositionResult) {
        const xMax = this._widthUnits - sw;
        const yMax = this._heightUnits - sh;

        for (let x = 0; x <= xMax; ++x) {
            for (let y = 0; y <= yMax; ++y) {
                if (this._checkAreaEmpty(x, y, sw, sh)) {
                    result.success = true;
                    result.grid = this;
                    result.fromX = x;
                    result.toX = x + sw - 1;
                    result.fromY = y;
                    result.toY = y + sh - 1;
                    return;
                }
            }
        }
    }

    private _findBestPosition(px: number, py: number, sw: number, sh: number, result: IFindValidPositionResult) {
        const xMax = this._widthUnits - sw;
        const yMax = this._heightUnits - sh;
        let distance: number = Number.MAX_VALUE;
        for (let x = 0; x <= xMax; ++x) {
            for (let y = 0; y <= yMax; ++y) {
                if (this._checkAreaEmpty(x, y, sw, sh)) {
                    const d = (px - x) * (px - x) + (py - y) * (py - y);
                    if (distance > d) {
                        distance = d;
                        result.success = true;
                        result.grid = this;
                        result.fromX = x;
                        result.toX = x + sw - 1;
                        result.fromY = y;
                        result.toY = y + sh - 1;
                    }
                }
            }
        }
    }

    private _getCell(x: number, y: number): Cell | null {
        if (x >= 0 && x < this._widthUnits && y >= 0 && y < this._heightUnits) {
            const cellIdx = y * this._widthUnits + x;
            if (cellIdx >= 0 && cellIdx < this._cells.length) {
                return this._cells[cellIdx];
            }
        }

        return null;
    }

    private _checkAreaEmpty(x: number, y: number, sw: number, sh: number): boolean {
        for (let w = 0; w < sw; ++w) {
            for (let h = 0; h < sh; ++h) {
                const cell = this._getCell(x + w, y + h);
                if (!cell || cell.hasItemOrFigure()) {
                    return false;
                }
            }
        }

        return true;
    }

    private _calculateCellPos(x: number, y: number, _oPos: BABYLON.Vector3): boolean {
        const posX = (x - 0.5 * this._widthUnits) * Constants.MYROOM_GRID_UNIT_SIZE;         //셀의 중심이 아니라 코너 좌표를 넘기다
        const posY = (y - 0.5 * this._heightUnits) * Constants.MYROOM_GRID_UNIT_SIZE;

        const pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(posX, posY, 0), this._pickingMesh!.getWorldMatrix());
        _oPos.copyFrom(pos);
        return true;

    }
}
;
