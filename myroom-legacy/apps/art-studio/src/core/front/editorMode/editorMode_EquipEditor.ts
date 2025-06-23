import * as BABYLON from "@babylonjs/core";
import { ipcRenderer } from "electron";
import { EditorApp } from "../editorApp";
import { EEditorMode, EditorModeBase } from "./editorModeBase";
import { ItemData } from "client-core/tableData/defines/System_Interface";
import { AvatarController, EItemCategory1 } from "client-core";
import { EItemCategory2, EItemCategory3 } from "client-core/tableData/defines/System_Enum";
import { Logger } from "../logger";
import * as path from "path";
import { EnvironmentController, TableDataManager } from "client-core";
import { ModelControllerBase } from "./modelController";
import { AvatarSkeleton } from "client-core/assetSystem/controllers/avatarSubSystem/avatarSkeleton";
import e from "cors";
import { IEquipState, equipStateAtom } from "../stores";
import { atom } from "jotai";
import { AvatarEquipment } from "client-core/assetSystem/controllers/avatarSubSystem/avatarEquipment";


class EditorMode_EquipEditor extends EditorModeBase {
    private _avatarController: AvatarController | null = null;

    public getAvatarController(): AvatarController | null {
        return this._avatarController;
    }

    public constructor(editor: EditorApp) {
        super(editor);
        this._editorMode = EEditorMode.ItemViewer;
    }

    protected _makeModelController(name: string, scene: BABYLON.Scene, assetDirForTool: string): ModelControllerBase | null {
        return null;
    }

    protected _onModelControllerLoaded(): void {
        this._fitCameraToModel();
    }

    public startMode(): void {
        console.log("EditorMode_EquipEditor startMode");

        if (this._avatarController === null) {
            this._avatarController = new AvatarController("", this._getScene(), this._getAssetLoader()!, this._getRoomContext(), null);
            this._avatarController.getAvatarSkeleton().loadSkeleton('36TDVdRgwobQmmgmIcArku');
        }

        //카메라 설정 고정으로 하자
        const camera = this._getScene().activeCamera as BABYLON.ArcRotateCamera;
        if (camera) {
            const radius = 2.4;
            camera.target = new BABYLON.Vector3(0, 0.72, 0);
            camera.alpha = Math.PI / 2;
            camera.beta = Math.PI / 2;
            camera.radius = radius;
            camera.lowerRadiusLimit = radius * 0.01;
            camera.wheelPrecision = 100 / radius;

            camera.alpha = Math.PI / 2;
            camera.beta = Math.PI / 2;

            camera.minZ = radius * 0.01;
            camera.maxZ = radius * 1000;
            camera.speed = radius * 0.2;

            camera.useFramingBehavior = true;
            const framingBehavior = camera.getBehaviorByName("Framing") as BABYLON.FramingBehavior;
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;

            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
            camera.lowerRadiusLimit = radius * 0.01;

        }
    }

    public endMode(): void {

    }

    public updateMode(): void {

    }

    public override openFiles(files: string[]): void {
        if (this._getAssetLoader() === null) {
            return;
        }

        if (files.length > 0) {
            const extName = path.extname(files[0]);
            const clientId = extName !== "" ? path.basename(path.dirname(files[0])) : path.basename(files[0]);
            this._assetDirForTool = extName !== "" ? path.dirname(files[0]) : files[0];
            let itemData = TableDataManager.getInstance().findItemByClientID(clientId);
            if (!itemData) {
                //아이템이 없을경우 툴지원을 위해 가상의 아이템을 Table에 추가해 주자
                const upperDir = path.basename(path.dirname(this._assetDirForTool));
                const fakeItemId = this._makeFakeItemId();
                const category = this._getCategoryFromItemData(upperDir);
                ipcRenderer.invoke('electron:addFakeItemData', fakeItemId, category.category1, category.category2, category.category3, clientId); //AssetServer가 사용하는 TableDataManager 수정

                TableDataManager.getInstance().addFakeItemDataForTool(fakeItemId, category.category1, category.category2, category.category3, clientId);
                itemData = TableDataManager.getInstance().findItemByClientID(clientId);
            }

            if (itemData && this._checkSupportedItemType(itemData)) {

                if (this._avatarController) {
                    const skelectonLoaded = this._avatarController.getAvatarSkeleton().getAssetId() !== "";

                    //파일이 스켈레톤인가? ==> 카테고리 정의가 상태 에니와 같아서 이름으로 처리한다.
                    if (itemData.category3 === EItemCategory3.STATUSFEEL && clientId.toLowerCase().indexOf("avatarskeleton") !== -1) {
                        const skeleton = this._avatarController.getAvatarSkeleton();
                        if (!skeleton.getAssetId()) {
                            skeleton.loadSkeleton(itemData.ID);
                        }
                        else {
                            Logger.error("스켈레톤 교체는 지원 하지 않습니다.");
                        }
                    }

                    //파일이 장착 아이템인가?
                    if (itemData.category2 === EItemCategory2.HEAD || itemData.category2 === EItemCategory2.BODY) {
                        if (skelectonLoaded) {
                            const equipment = this._avatarController.getAvatarEquipment();
                            equipment.equipItem(itemData.ID);//.then(() => { this._fitCameraToModel(); });
                        }
                        else {
                            Logger.error("먼저 스켈레톤 부터 로드를 해주세요");
                        }
                    }

                    //파일이 Ani인가?
                    if (itemData.category3 === EItemCategory3.STATUSFEEL && clientId.toLowerCase().indexOf("avatarskeleton") === -1) {
                        if (skelectonLoaded) {
                            const anim = this._avatarController.getAvatarAnimation();
                            anim.LoadAndPlayAnimation(itemData.ID);
                        }
                        else {
                            Logger.error("먼저 스켈레톤 부터 로드를 해주세요");
                        }
                    }
                }
            }
            else {
                if (!itemData) {
                    Logger.error("아이템을 찿을수 없습니다");
                }
                else {
                    Logger.error("지원하지 않는 아이템 타입입니다.");
                }
            }
        }
    }



    protected override _checkSupportedItemType(itemData: ItemData): boolean {
        switch (itemData.category1) {
            case EItemCategory1.AVATAR:
                return true;
        }

        if (itemData.category3 === EItemCategory3.STATUSFEEL) {
            return true;
        }

        return false;
    }


    public getUIData(): IEquipState {
        const equipState = {
            skeleton: this._avatarController ? this._avatarController.getAvatarSkeleton().getAssetId() : "",
            animation: this._getUIDataHelper_Animation(),
            equipment: this._getUIDataHelper_Equipment(),
            customization: this._getUIDataHelper_Customization(),
        };
        return equipState;
    }

    private _getUIDataHelper_Animation(): string[] {
        const anim = this._avatarController?.getAvatarAnimation();
        if (anim) {
            const result: string[] = [];
            const aniIds = anim.getAllAnimationIds();
            aniIds.forEach(aniId => {
                const aniData = TableDataManager.getInstance().findItem(aniId);
                if (aniData) {
                    result.push(aniData.client_itemid);
                }
            });
            return result;
        }
        return [];
    }

    private _getUIDataHelper_Equipment(): { slot: string, item: string; }[] {
        const equipment = this._avatarController?.getAvatarEquipment();
        if (equipment) {
            const infos: { slot: string, item: string; }[] = [];
            const allItems = equipment.getAllEquipItems();
            allItems.forEach(itemId => {
                const itemData = TableDataManager.getInstance().findItem(itemId);
                if (itemData) {
                    const slotName = itemData ? this._getUIDataHelper_GetSlotName(itemData.category3) : "unknown";
                    const name = itemData ? itemData.client_itemid : "unknown";
                    infos.push({ slot: slotName, item: name });
                }

            });
            return infos;
        }

        return [];
    }

    private _getUIDataHelper_Customization(): { hairColor: string; skinColor: string; } {
        const avatarCustomization = this._avatarController?.getAvatarCustomization();
        if (avatarCustomization) {
            return { hairColor: avatarCustomization.getHairColor(), skinColor: avatarCustomization.getSkinColor() };
        }

        return { hairColor: "", skinColor: "" };
    }

    private _getUIDataHelper_GetSlotName(category3: EItemCategory3): string {
        switch (category3) {
            case EItemCategory3.HAIR:
                return "헤어";
            case EItemCategory3.HEADACC:
                return "장신구";
            case EItemCategory3.EYEBALL:
                return "눈동자";
            case EItemCategory3.CLOTHES:
                return "옷";
            case EItemCategory3.COSTUME:
                return "코스튬";

        }

        return "unknown";
    }

    //-----------------------------------------------------------------------------------
    // Play Ani
    //-----------------------------------------------------------------------------------
    public static readonly EDITOR_COMMAND_PLAY_ANI = "playAni";
    public static readonly EDITOR_COMMAND_UNEQUIP_ITEM = "unequipItem";
    public static readonly EDITOR_COMMAND_SET_SKINCOLOR = "setSkinColor";
    public static readonly EDITOR_COMMAND_SET_HAIRCOLOR = "setHairColor";

    public executeCommand(command: string, ...args: any[]): void {
        switch (command) {
            case EditorMode_EquipEditor.EDITOR_COMMAND_PLAY_ANI:
                {
                    if (args.length === 1) {
                        const aniName = args[0];
                        const anim = this._avatarController?.getAvatarAnimation();
                        if (anim) {
                            const aniData = TableDataManager.getInstance().findItemByClientID(aniName);
                            if (aniData) {
                                anim.LoadAndPlayAnimation(aniData.ID);
                            }
                            else {
                                Logger.error("애니메이션을 찿을수 없습니다");
                            }
                        }
                    }
                }
                break;

            case EditorMode_EquipEditor.EDITOR_COMMAND_UNEQUIP_ITEM:
                {
                    if (args.length === 1) {
                        const itemName = args[0];
                        const equipment = this._avatarController?.getAvatarEquipment();
                        if (equipment) {
                            const itemData = TableDataManager.getInstance().findItemByClientID(itemName);
                            if (itemData) {
                                const slotName = AvatarEquipment.getSlotName(itemData.ID);
                                equipment.unequipItem(slotName);
                            }
                            else {
                                Logger.error("아이템을 찿을수 없습니다");
                            }
                        }
                    }
                }
                break;

            case EditorMode_EquipEditor.EDITOR_COMMAND_SET_SKINCOLOR:
                {
                    if (args.length === 1) {
                        const skinColor = args[0];
                        const customization = this._avatarController?.getAvatarCustomization();
                        if (customization) {
                            customization.setSkinColor(skinColor);
                        }
                    }
                }
                break;

            case EditorMode_EquipEditor.EDITOR_COMMAND_SET_HAIRCOLOR:
                {
                    if (args.length === 1) {
                        const hairColor = args[0];
                        const customization = this._avatarController?.getAvatarCustomization();
                        if (customization) {
                            customization.setHairColor(hairColor);
                        }
                    }
                }
                break;
        }
    }
}

export { EditorMode_EquipEditor };