export interface ITreeViewContextMenuItem {
    /**
     * Display label - menu item
     */
    label: string;
    /**
     * Callback function that will be called when the menu item is selected
     * @param entity the entity that is currently selected in the scene explorer
     */
    action: (entity?: unknown) => void;
}

export interface IEntityInfo {
    type: string;
    name: string;
    uniqueId: string;
    object: any;
    reservedDataStore: any;
}
