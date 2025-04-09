import * as BABYLON from "@babylonjs/core";
import { AvatarController } from "../avatarController";
import { TableDataManager } from "../../../tableData/tableDataManager";
import { EItemCategory3 } from "../../../tableData/defines/System_Enum";
import { PostAssetLoader } from "../../postAssetLoader/postAssetLoader";
//import { eAssetType } from "@/assetSystem/definitions";

export class AvatarEquipment {
    private _owner: AvatarController;
    private _equipItems: Map<string, string> = new Map<string, string>(); //(slotName,itemId)
    private _equipItemMeshes: Map<string, Array<BABYLON.AbstractMesh>> = new Map<string, Array<BABYLON.AbstractMesh>>(); //(slotName,mesh[])
    private _curEquipSlotName: string = ""; //아트 지원용

    public getEquipItem(slotName: string): string {
        return this._equipItems.get(slotName) || "";
    }

    public getAllEquipItems(): string[] {
        const items: string[] = [];
        this._equipItems.forEach((v) => {
            items.push(v);
        });
        return items;
    }

    public getEquipMeshes(slotName: string): BABYLON.AbstractMesh[] {
        return this._equipItemMeshes.get(slotName) || [];
    }

    public constructor(owner: AvatarController) {
        this._owner = owner;
        this._curEquipSlotName = "";
    }

    public finalize() {
        this._equipItemMeshes.forEach(m => {
            if (m instanceof BABYLON.Mesh) {
                m.dispose();
            }
        });
    }


    public async equipAllItems(assetIds: string[]): Promise<void> {
        const processes = [];
        for (let ii = 0; ii < assetIds.length; ++ii) {
            processes.push(this.equipItem(assetIds[ii]));
        }
        if (processes.length > 0) {
            await Promise.all(processes);
        }
    }

    public unEquipAllItems() {
        const allSlots = [... this._equipItems.keys()];
        for (let ii = 0; ii < allSlots.length; ++ii) {
            this.unequipItem(allSlots[ii]);
        }
    }

    public async equipItem(assetId: string): Promise<string | undefined> {
        if (!assetId) {
            console.error(`AvatarEquipment.equipItem() => assetId is null , avatarId = ${this._owner.getAvatarId()}`);
            return undefined;
        }

        // 연달아서 equipItem을 호출할 경우, this._curEquipSlotName 가 바뀌므로, local const로 처리 (by ulralra 230823)
        const curEquipSlotName = AvatarEquipment.getSlotName(assetId);
        this._curEquipSlotName = curEquipSlotName;
        const oldItem = this.unequipItem(curEquipSlotName, true, false, false);
        await this._owner.getAssetLoader().loadAvatarAsset(assetId, (equipmentImportResult) => {
            if (equipmentImportResult) {
                //메쉬 parent 변경하고, skeleton 교체
                const skeleton = this._owner.getAvatarSkeleton().getSkeleton();
                equipmentImportResult.meshes.forEach(mesh => {
                    if (mesh.parent === null) {
                        const equipMeshes = [];
                        const childMeshes = mesh.getChildMeshes();
                        for (let cc = 0; cc < childMeshes.length; ++cc) {
                            if (childMeshes[cc].subMeshes.length > 0) {
                                childMeshes[cc].parent = this._owner.getSkinRootMesh();
                                if (childMeshes[cc].skeleton) {
                                    //childMeshes[cc].skeleton = this._owner.getAvatarSkeleton().getSkeleton();//skeleton 교체
                                    childMeshes[cc].skeleton!.bones.forEach(bone => {
                                        const prevNode = bone.getTransformNode();
                                        if (prevNode) {
                                            const newNode = skeleton?.bones.find(node => node.name === prevNode.name);
                                            if (newNode) {
                                                bone.linkTransformNode(newNode.getTransformNode());
                                            } else {
                                                //console.error("no bone linkTransformNode", prevNode.name);
                                            }
                                        }
                                    });
                                }
                                equipMeshes.push(childMeshes[cc]);
                            }
                        }

                        this._equipItemMeshes.set(curEquipSlotName, equipMeshes);
                        this._equipItems.set(curEquipSlotName, assetId);
                    }
                });

                //사용하지 않는 메쉬 제거
                equipmentImportResult.meshes.forEach(mesh => { mesh.parent || mesh.dispose(); });

                //사용하지 않는 skeleton 제거
                //equipmentImportResult.skeletons.forEach(sk => { sk.dispose(); });

                //사용하지 않는 AnimationGroup 제거
                equipmentImportResult.animationGroups.forEach(ani => { ani.dispose(); });
            }
        });

        // Costume 장착시 다른 매쉬 hide 처리
        if (this._isEquipCostume()) {
            console.log(`AvatarEquipment.equipItem() => Costume 장착시 다른 매쉬 hide 처리`);
            this._showHideOtherSlotsForCostume(false);
        }

        this._owner.getAvatarParticle().equipParts(assetId, this._isEquipCostume());

        return oldItem;
    }

    public unequipItem(slotName: string, exchange: boolean = false, isWebCall = false, checkCostume: boolean = true): string | undefined {
        if (!exchange && AvatarEquipment.isMustHaveSlot(slotName)) {
            //항상 있어야 하는 아이템은 교체 상황이 아니면 벗을수 없다
            console.error(`AvatarEquipment.unequipItem() => 벗을수 없은 슬롯입니다. slotName = ${slotName} , avatarId = ${this._owner.getAvatarId()}`);
            return undefined;
        } else {
            // 프론트에서 unEquip 명령 내릴 시 slotName 자체가 아이템 아이디로 오기 때문에 추가,
            // isWebCall 로 분리 안할 시, 새로운 아이템 장착 시 이전 아이템 유지되기 때문에 추가
            if (isWebCall) slotName = AvatarEquipment.getSlotName(slotName);
        }

        // Costume 장착해지시  다른 매쉬 show 처리
        if (checkCostume && AvatarEquipment.isCostumeSlot(slotName)) {
            this._showHideOtherSlotsForCostume(true);
        }


        this._owner.getAvatarParticle().unequipParts(slotName);

        const oldItem = this._equipItems.get(slotName);
        this._equipItems.set(slotName, "");
        const meshes = this._equipItemMeshes.get(slotName);
        this._equipItemMeshes.set(slotName, []);
        if (meshes) {
            meshes.forEach(mesh => mesh.dispose());
        }

        return oldItem;
    }

    public refreshCustomInspectorProperties(inspectableCustomProperties: BABYLON.IInspectable[]) {

        inspectableCustomProperties.push({
            label: "Load Parts (GLB)",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadEquipment_File(file);
            },
            accept: ".glb"
        });
    }


    //-----------------------------------------------------------------------------------
    // Private Helpers
    //-----------------------------------------------------------------------------------

    private _loadEquipment_File(file: File): void {
        BABYLON.SceneLoader.ImportMesh("", "", file, this._owner.getScene(), (meshes, _particleSystems, skeletons, animationGroups, _transformNodes, _geometries, _lights) => {
            meshes.forEach(mesh => {
                if (mesh.parent === null) {
                    const equipMeshes = [];
                    const childMeshes = mesh.getChildMeshes();
                    for (let cc = 0; cc < childMeshes.length; ++cc) {
                        if (childMeshes[cc].subMeshes.length > 0) {
                            childMeshes[cc].parent = this._owner.getSkinRootMesh();
                            if (childMeshes[cc].skeleton) {
                                childMeshes[cc].skeleton = this._owner.getAvatarSkeleton().getSkeleton();//skeleton 교체
                            }
                            equipMeshes.push(childMeshes[cc]);
                        }
                    }
                    this._equipItemMeshes.set(this._curEquipSlotName, equipMeshes);
                }
            });


            //사용하지 않는 메쉬 제거
            meshes.forEach(mesh => { mesh.parent || mesh.dispose(); });

            //사용하지 않는 skeleton 제거
            skeletons.forEach(sk => { sk.dispose(); });

            //사용하지 않는 AnimationGroup 제거
            animationGroups.forEach(ani => { ani.dispose(); });
        });
    }

    public async loadEquipmentFromAssetBuffer(assetBufferView: ArrayBufferView) {
        const file = new File([assetBufferView], "part", { type: "application/octet-stream" });
        //this._loadEquipment_File(file);


        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", file, this._owner.getScene(), undefined, ".glb", "part");
        result.meshes.forEach(mesh => {
            if (mesh.parent === null) {
                const equipMeshes = [];
                const childMeshes = mesh.getChildMeshes();
                for (let cc = 0; cc < childMeshes.length; ++cc) {
                    if (childMeshes[cc].subMeshes.length > 0) {
                        childMeshes[cc].parent = this._owner.getSkinRootMesh();
                        if (childMeshes[cc].skeleton) {
                            childMeshes[cc].skeleton = this._owner.getAvatarSkeleton().getSkeleton();//skeleton 교체
                        }
                        equipMeshes.push(childMeshes[cc]);
                    }
                }
                this._equipItemMeshes.set(this._curEquipSlotName, equipMeshes);
            }
        });


        //사용하지 않는 메쉬 제거;
        result.meshes.forEach(mesh => { mesh.parent || mesh.dispose(); });

        //사용하지 않는 skeleton 제거;
        result.skeletons.forEach(sk => { sk.dispose(); });

        //사용하지 않는 AnimationGroup 제거;
        result.animationGroups.forEach(ani => { ani.dispose(); });

    }

    private _showHideOtherSlotsForCostume(bShow: boolean) {
        this._showHideSlot(AvatarEquipment.getSlotNameByCategory3(EItemCategory3.HAIR), bShow);
        this._showHideSlot(AvatarEquipment.getSlotNameByCategory3(EItemCategory3.HEADACC), bShow);
        this._showHideSlot(AvatarEquipment.getSlotNameByCategory3(EItemCategory3.EYEBALL), bShow);
        this._showHideSlot(AvatarEquipment.getSlotNameByCategory3(EItemCategory3.CLOTHES), bShow);
    }

    private _showHideSlot(slotName: string, bShow: boolean) {
        const meshes = this._equipItemMeshes.get(slotName);
        meshes?.forEach(mesh => {
            mesh.setEnabled(bShow);
        });

        this._owner.getAvatarParticle().setVisibleParts(slotName, bShow);
    }

    private _isEquipCostume(): boolean {
        return this.getEquipItem(AvatarEquipment.getSlotNameByCategory3(EItemCategory3.COSTUME)) !== "";
    }

    //-----------------------------------------------------------------------------------
    // Static Helpers
    //-----------------------------------------------------------------------------------
    public static getSlotName(itemid: string): string {
        const tableData = TableDataManager.getInstance().findItem(itemid);
        if (tableData) {
            return `Slot_${tableData.category3}`;
        }
        return `Slot_${itemid}`; //artStudio 툴에서 사용한다!!! 아트에서 아이템 등록전에 확인하기위해
    }

    public static getSlotNameByCategory3(category3: EItemCategory3): string {
        return `Slot_${category3}`;
    }

    public static isMustHaveSlot(slotName: string): boolean {
        return slotName === `Slot_${EItemCategory3.CLOTHES}` || slotName === `Slot_${EItemCategory3.EYEBALL}` || slotName === `Slot_${EItemCategory3.HAIR}`;
    }

    public static isCostumeSlot(slotName: string): boolean {
        return slotName === `Slot_${EItemCategory3.COSTUME}`;
    }
}