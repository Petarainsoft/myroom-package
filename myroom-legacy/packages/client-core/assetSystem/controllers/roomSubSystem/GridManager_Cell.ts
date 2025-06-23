import { Grid } from "./GridManager_Grid";

export class Cell {
    private _grid: Grid;
    private _placedItemInstanceId: string;
    private _placedFigureId: string;
    private _isMarked: boolean;

    public getGrid(): Grid {
        return this._grid;
    }

    public setPlacedItemInstanceId(itemInstanceId: string) {
        this._placedItemInstanceId = itemInstanceId;
    }

    public getPlacedItemInstanceId(): string {
        return this._placedItemInstanceId;
    }

    public setPlacedFigureId(figureId: string) {
        return this._placedFigureId = figureId;
    }

    public getPlacedFigureId(): string {
        return this._placedFigureId;
    }

    public isMarked(): boolean {
        return this._isMarked;
    }

    public hasItemOrFigure(): boolean {
        return (this._placedItemInstanceId !== "") || (this._placedFigureId !== "") || this.isMarked();
    }

    constructor(gird: Grid, isMarked: boolean) {
        this._grid = gird;
        this._placedItemInstanceId = "";
        this._placedFigureId = "";
        this._isMarked = isMarked;
    }
}