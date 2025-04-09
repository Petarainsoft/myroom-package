



export enum RoomCategory {
    /** Market */
    ITEM = "13",
    FIGURE = "FIGURE",
    SKIN = "12",
    LIGHT = "122111",

    /** User */
    COORDI = "COORDI",
    SYS_COORDI = "14",
    MY_ITEM = "MY_ITEM",
    MY_SKIN = "MY_SKIN",
    SCRAP = "SCRAP",

    /** */
    TRASH = "TRASH",
}


export type RoomSubCategory = string | "FREE";






export type SelectedItem = {
    id:string;
    itemId?:string;
    type: "AVATAR" | "FIGURE" | "ITEM";
}