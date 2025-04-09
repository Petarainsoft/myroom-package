import { EditorApp } from "../editorApp";
import { IItemExplorerDatas } from "@/components/ItemExplorer/itemExplorerComponent";

export class UIController {
    private _editor: EditorApp;
    private _itemExplorerData: IItemExplorerDatas = { itemName: "", meshes: [], materials: [], textures: [] };
    private _itemExplorerDataChanged: boolean = false;

    constructor(editor: EditorApp) {
        this._editor = editor;
    }

    public getItemExplorerDataChanged(): boolean {
        return this._itemExplorerDataChanged;
    }

    public getItemExplorerData(): IItemExplorerDatas {
        this._itemExplorerDataChanged = false;
        return this._itemExplorerData;
    }

    public rebuildTreeView(treeData: IItemExplorerDatas): void {
        this._itemExplorerData = { ...treeData };
        this._itemExplorerDataChanged = true;
    }

    protected getEditor(): EditorApp {
        return this._editor;
    }
}