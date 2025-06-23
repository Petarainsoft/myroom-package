import { AvatarController } from "../avatarController";
import { ItemController } from "../itemController";
import { MyRoomController } from "../myRoomController";

export class RoomObjectCounter {
    private _roomController: MyRoomController;
    public gAllItemControllers: ItemController[] = [];
    public gAllAvatarControllers: AvatarController[] = [];

    public constructor(roomController: MyRoomController) {
        this._roomController = roomController;
        this.gAllItemControllers = [];
        this.gAllAvatarControllers = [];
    }

    public registerItemController(controller: ItemController) {
        if (this.gAllItemControllers.findIndex((c) => c.getItemInstanceId() === controller.getItemInstanceId()) < 0) {
            this.gAllItemControllers.push(controller);
            this._roomController.notifyRoomObjectCountChanged();
            return;
        }

        console.error("RoomObjectCounter.registerItemController() => already exist in..");
    }

    public unregisterItemController(controller: ItemController) {
        const idx = this.gAllItemControllers.findIndex((c) => c.getItemInstanceId() === controller.getItemInstanceId());
        if (idx >= 0) {
            this.gAllItemControllers.splice(idx, 1);
            this._roomController.notifyRoomObjectCountChanged();
            return;
        }

        console.error("RoomObjectCounter.unregisterItemController() => no item..");
    }

    public getAllItemControllerItemIds(): string[] {
        const retVal: string[] = [];
        this.gAllItemControllers.forEach((c) => {
            retVal.push(c.getItemId());
        });

        return retVal;
    }

    public getAllItemControllerItemInstanceIds(): string[] {
        const retVal: string[] = [];
        this.gAllItemControllers.forEach((c) => {
            retVal.push(c.getItemInstanceId());
        });

        return retVal;
    }

    public registerAvatarController(controller: AvatarController) {
        if (this.gAllAvatarControllers.findIndex((c) => c.getAvatarId() === controller.getAvatarId()) < 0) {
            //console.error(`>>>>>>>>>>>>>> ${controller.getAvatarId()}`);
            this.gAllAvatarControllers.push(controller);
            this._roomController.notifyRoomObjectCountChanged();
            return;
        }

        console.error("RoomObjectCounter.registerAvatarController() => already exist in..");
    }

    public unregisterAvatarController(controller: AvatarController) {
        const idx = this.gAllAvatarControllers.findIndex((c) => c.getAvatarId() === controller.getAvatarId());
        if (idx >= 0) {
            this.gAllAvatarControllers.splice(idx, 1);
            this._roomController.notifyRoomObjectCountChanged();
            return;
        }

        console.error(`RoomObjectCounter.unregisterAvatarController() => no avatar.. ,id == ${controller.getAvatarId()}`);
    }

    public getAllAvatarControllerAvatarIds(): string[] {
        const retVal: string[] = [];
        this.gAllAvatarControllers.forEach((c) => {
            retVal.push(c.getAvatarId());
        });

        return retVal;
    }
}