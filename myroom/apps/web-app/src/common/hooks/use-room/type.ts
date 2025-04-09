/**
 * 
 */
export type RoomInfo = {
    id: string;
    ownerId: string;
    avatarId: string;
    mine:boolean;
} | null;

/**
 * 
 */
export type SelectedItem = {
    id:string;
    type : "ITEM" | "AVATAR" | "FIGURE";
}