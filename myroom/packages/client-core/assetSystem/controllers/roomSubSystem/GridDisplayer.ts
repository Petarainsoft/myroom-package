import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from '@babylonjs/materials/grid';
// import { GridMaterial } from '@babylonjs/materials/Grid'; ci/cd 대문자 Grid 일 시 실패함
import { Grid } from "./GridManager_Grid";
import { Constants } from "../../constants";
import { MyRoomController } from "../myRoomController";
import { eGridNormal } from "../../definitions";

export class GridDisplayer {
    private _owner: MyRoomController;
    private _scene: BABYLON.Scene;

    private _gridMaterial: BABYLON.Nullable<GridMaterial> = null;
    private _gridMesh: BABYLON.Nullable<BABYLON.Mesh> = null;
    private _gridMeshVertexData: BABYLON.Nullable<BABYLON.VertexData> = null;
    private _indicatorMaterial: BABYLON.Nullable<BABYLON.StandardMaterial> = null;
    private _indicator: BABYLON.Nullable<BABYLON.TransformNode> = null;
    private _gridMarkMeshes: BABYLON.Mesh[] = [];

    private _lastGridMeshSizeW: number = 1;
    private _lastGridMeshSizeH: number = 1;
    private _lastGridMeshInvert: boolean = false;
    private _gridMarkMaterial: BABYLON.Nullable<BABYLON.StandardMaterial> = null;

    constructor(owner: MyRoomController, scene: BABYLON.Scene) {
        this._owner = owner;
        this._scene = scene;

        this._createGridMaterial();
        this._createGridMesh();
        this._createGridMarkMeshes();
        this._createIndicator();
        this._hideGrid();
        this._hideIndicator();
    }

    public finalize() {

        this._gridMaterial?.dispose();
        this._gridMaterial = null;

        this._gridMesh?.dispose();
        this._gridMesh = null;

        this._gridMeshVertexData = null;

        this._indicatorMaterial?.dispose();
        this._indicatorMaterial = null;
        this._indicator?.dispose();

        this._gridMarkMeshes.forEach((m) => { m.dispose(); });
        this._gridMarkMeshes = [];

        this._gridMarkMaterial?.dispose();
        this._gridMarkMaterial = null;
    }


    public update(targetGrid: Grid | null, isValidArea: boolean, fromX: number, toX: number, fromY: number, toY: number) {
        if (targetGrid && this._gridMesh && this._indicator) {
            //pos 맞추기
            this._gridMesh.setAbsolutePosition(BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 0.01), targetGrid.getPickingMesh()!.getWorldMatrix()));

            //rot 맞추기
            if (targetGrid.getGridNormal() == eGridNormal.Y) {
                const objectRot = targetGrid.getOwnerNode().absoluteRotationQuaternion.toEulerAngles();
                this._gridMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(BABYLON.Tools.ToRadians(270), BABYLON.Tools.ToRadians(180 + BABYLON.Tools.ToDegrees(objectRot.y)), 0); //오브젝트 회전 추가 해야한다
            }
            else if (targetGrid.getGridNormal() == eGridNormal.X) {
                this._gridMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(270), 0);
            }
            else if (targetGrid.getGridNormal() == eGridNormal.Z) {
                this._gridMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(180), 0);
            }


            //scale 맞추기
            const invert = targetGrid.getGridNormal() == eGridNormal.Z ? true : false;
            // this._gridMesh.scaling = new BABYLON.Vector3(targetGrid.getWidthUnits() * Constants.MYROOM_GRID_UNIT_SIZE, targetGrid.getHeightUnits() * Constants.MYROOM_GRID_UNIT_SIZE, invertZ);
            this._updateGridMeshSize(targetGrid.getWidthUnits(), targetGrid.getHeightUnits(), invert);


            //material grid 맞추기
            if (this._gridMaterial) {
                //this._gridMaterial.gridRatio = Constants.MYROOM_GRID_UNIT_SIZE / this._gridMesh.scaling.x;
                this._gridMaterial.gridRatio = Constants.MYROOM_GRID_UNIT_SIZE;
                const gridOffsetX = (targetGrid.getWidthUnits() * Constants.MYROOM_GRID_UNIT_SIZE % 2) * 0.5;
                const gridOffsetY = (targetGrid.getHeightUnits() * Constants.MYROOM_GRID_UNIT_SIZE % 2) * 0.5;
                this._gridMaterial.gridOffset = new BABYLON.Vector3(gridOffsetX, gridOffsetY, 0);
            }


            //Grid Mark Mesh들 그리기
            for (let ii = 0; ii < Constants.MYROOM_GRID_MARK_MAX_COUNT; ++ii) {
                const markArray = targetGrid.getGridMarkArray();
                if (ii < markArray.length) {
                    const oMarkPos: BABYLON.Vector3 = new BABYLON.Vector3();
                    if (targetGrid.calculateAbsolutePostion(markArray[ii].fromX, markArray[ii].toX, markArray[ii].fromY, markArray[ii].toY, oMarkPos)) {
                        this._gridMarkMeshes[ii].setAbsolutePosition(oMarkPos);
                        this._gridMarkMeshes[ii].rotationQuaternion = this._gridMesh.rotationQuaternion;
                        this._gridMarkMeshes[ii].scaling = new BABYLON.Vector3((markArray[ii].toX - markArray[ii].fromX + 1) * Constants.MYROOM_GRID_UNIT_SIZE, (markArray[ii].toY - markArray[ii].fromY + 1) * Constants.MYROOM_GRID_UNIT_SIZE, 1);
                        this._gridMarkMeshes[ii].setEnabled(true);
                    }
                    else {
                        this._gridMarkMeshes[ii].setEnabled(false);
                    }
                }
                else {
                    this._gridMarkMeshes[ii].setEnabled(false);
                }
            }


            this._showGrid();

            //인디케이터 위치 맞추기
            const oPos: BABYLON.Vector3 = new BABYLON.Vector3();
            if (targetGrid.calculateAbsolutePostion(fromX, toX, fromY, toY, oPos)) {
                this._indicator.setAbsolutePosition(oPos);
                this._indicator.rotationQuaternion = this._gridMesh.rotationQuaternion;
                this._indicator.scaling = new BABYLON.Vector3((toX - fromX + 1) * Constants.MYROOM_GRID_UNIT_SIZE, (toY - fromY + 1) * Constants.MYROOM_GRID_UNIT_SIZE, 1);
                this._showIndicator();
                this._setIndicatorColor(isValidArea);
            }
            else {
                this._hideIndicator();
            }

            return;
        }

        this._hideGrid();
        this._hideIndicator();
    }

    private _showGrid() {
        if (this._gridMesh && !this._gridMesh.isEnabled()) {
            this._gridMesh.setEnabled(true);
        }
    }

    private _hideGrid() {
        if (this._gridMesh && this._gridMesh.isEnabled()) {
            this._gridMesh.setEnabled(false);
        }

        this._gridMarkMeshes.forEach((m) => m.setEnabled(false));
    }

    public _showIndicator() {
        if (this._indicator && !this._indicator.isEnabled()) {
            this._indicator.setEnabled(true);
        }
    }

    public _hideIndicator() {
        if (this._indicator && this._indicator.isEnabled()) {
            this._indicator.setEnabled(false);
        }
    }

    private _createGridMaterial() {
        const mtl = new GridMaterial("groundMaterial", this._scene);
        mtl.gridRatio = 0.5;
        mtl.majorUnitFrequency = 2;
        mtl.minorUnitVisibility = 0.5;
        mtl.opacity = 0.99;
        mtl.useMaxLine = true;
        mtl.gridOffset = new BABYLON.Vector3(0.5, 0.5, 0);

        this._gridMaterial = mtl;
    }

    private _createGridMesh() {
        //const plane = BABYLON.MeshBuilder.CreatePlane("[Grid]", { width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene);
        const plane = new BABYLON.Mesh("[Grid]", this._scene);
        plane.material = this._gridMaterial;
        plane.parent = this._owner;
        this._gridMesh = plane;
        this._updateGridMeshSize(4, 4, false);
    }

    private _createGridMarkMeshes() {
        const markMeshRoot = new BABYLON.TransformNode("[Grid MarkMeshes]", this._scene);
        markMeshRoot.parent = this._owner;

        const markMtl = new BABYLON.StandardMaterial("[Grid Mark]", this._scene);
        markMtl.diffuseColor = BABYLON.Color3.Red();
        markMtl.disableLighting = true;
        markMtl.emissiveColor = BABYLON.Color3.Red();
        markMtl.alpha = 0.3;
        this._gridMarkMaterial = markMtl;

        for (let ii = 0; ii < Constants.MYROOM_GRID_MARK_MAX_COUNT; ++ii) {
            const plane = BABYLON.MeshBuilder.CreatePlane("[Indicator Mesh]", { width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene);
            plane.isPickable = false;
            plane.material = markMtl;
            plane.parent = markMeshRoot;
            this._gridMarkMeshes.push(plane);
        }
    }

    private _createIndicator() {
        var utilLayer = new BABYLON.UtilityLayerRenderer(this._scene);

        this._indicator = new BABYLON.TransformNode("[Grid Indicator]", this._scene);
        this._indicator.parent = this._owner;

        const indicatorMtl = new BABYLON.StandardMaterial("[Indicator]", utilLayer.utilityLayerScene);
        indicatorMtl.diffuseColor = BABYLON.Color3.Green();
        indicatorMtl.disableLighting = true;
        indicatorMtl.emissiveColor = BABYLON.Color3.Green();
        indicatorMtl.alpha = 0.5;

        this._indicatorMaterial = indicatorMtl;
        const indicatorMesh = BABYLON.MeshBuilder.CreatePlane("[Indicator Mesh]", { width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, utilLayer.utilityLayerScene);
        indicatorMesh.isPickable = false;
        indicatorMesh.material = indicatorMtl;
        //indicatorMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(BABYLON.Tools.ToRadians(90), 0, 0);
        //indicatorMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(BABYLON.Tools.ToRadians(90), 0, 0);
        indicatorMesh.parent = this._indicator;
    }

    private _setIndicatorColor(isValidArea: boolean) {
        if (this._indicatorMaterial) {
            this._indicatorMaterial.diffuseColor = isValidArea ? BABYLON.Color3.Green() : BABYLON.Color3.Red();
            this._indicatorMaterial.emissiveColor = isValidArea ? BABYLON.Color3.Green() : BABYLON.Color3.Red();
        }
    }

    private _updateGridMeshSize(w: number, h: number, invert: boolean) {
        if (this._lastGridMeshSizeW === w && this._lastGridMeshSizeH === h && this._lastGridMeshInvert === invert) {
            return;
        }

        //Set arrays for positions and indices
        const hw: number = w * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
        const hh: number = h * Constants.MYROOM_GRID_UNIT_SIZE * 0.5;
        const positions = [
            -hw, -hh, 0,  //Left Bottom
            -hw, hh, 0,   //Left Top
            hw, hh, 0,    //Right Top
            hw, -hh, 0,   //Right Bottom
        ];
        const indices = !invert ? [0, 1, 2, 2, 3, 0] : [2, 1, 0, 0, 3, 2];
        const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        if (null == this._gridMeshVertexData) {
            this._gridMeshVertexData = new BABYLON.VertexData();
        }

        //Assign positions, indices and normals to vertexData
        this._gridMeshVertexData.positions = positions;
        this._gridMeshVertexData.indices = indices;
        this._gridMeshVertexData.normals = normals;

        //Apply vertexData to custom mesh
        this._gridMeshVertexData.applyToMesh(this._gridMesh!);

        this._lastGridMeshInvert = invert;
        this._lastGridMeshSizeW = w;
        this._lastGridMeshSizeH = h;
    }
}
