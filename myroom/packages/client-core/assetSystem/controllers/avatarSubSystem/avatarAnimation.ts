import * as BABYLON from "@babylonjs/core";
import { AvatarController } from "../avatarController";
import { PostAssetLoader } from "../../postAssetLoader/postAssetLoader";
import { Constants } from "../../constants";

export enum EAvatarAnimationType {
    StatusAni_1,
    StatusAni_2,
    ThumbNail
}

export class StatusAnimationData {
    private _statusAni: BABYLON.AnimationGroup | null = null;
    private _statusObjectRoot: BABYLON.TransformNode | null = null; //메쉬 일수 있다!!!
    private _statusObjectSkeleton: BABYLON.Skeleton | null = null;
    private _finishObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.TargetedAnimation>> | undefined;

    public get statusAni(): BABYLON.AnimationGroup | null {
        return this._statusAni;
    }

    public set statusAni(ani: BABYLON.AnimationGroup | null) {
        this._statusAni = ani;
    }

    public get statusObejctRoot(): BABYLON.TransformNode | null {
        return this._statusObjectRoot;
    }

    public set statusObejctRoot(mesh: BABYLON.TransformNode | null) {
        this._statusObjectRoot = mesh;
    }

    public get statusObjectSkeleton(): BABYLON.Skeleton | null {
        return this._statusObjectSkeleton;
    }

    public set statusObjectSkeleton(sk: BABYLON.Skeleton | null) {
        this._statusObjectSkeleton = sk;
    }

    public showStatusObject(bShow: boolean) {
        this._statusObjectRoot?.setEnabled(bShow);
    }

    public isStatusObjectMesh(mesh: BABYLON.AbstractMesh) {
        if (this._statusObjectRoot instanceof BABYLON.AbstractMesh) {
            return this._statusObjectRoot === mesh;
        }
        else if (this._statusObjectRoot) {
            return this._statusObjectRoot.getChildMeshes().findIndex((m) => m === mesh) >= 0;
        }

        return false;
    }

    public isStatusObjectSkeleton(sk: BABYLON.Skeleton) {
        return this._statusObjectSkeleton === sk;
    }

    public setFinishCallbackOnce(callback?: () => void) {
        if (this._finishObserver) {
            this._statusAni?.onAnimationEndObservable.remove(this._finishObserver);
            this._finishObserver = null;
        }
        if (callback) {
            this._finishObserver = this._statusAni?.onAnimationEndObservable.addOnce(callback);
        }
    }

    public finalize() {
        this.setFinishCallbackOnce();
        this._statusAni?.dispose();
        if (this._statusObjectRoot instanceof BABYLON.AbstractMesh) {
            this._statusObjectRoot.dispose();
        }
        else if (this._statusObjectRoot) {
            return this._statusObjectRoot.getChildMeshes().findIndex((m) => { m.dispose(); });
        }
    }
}

export class AvatarAnimation {
    private _owner: AvatarController;
    private _animationDatas: Map<string, StatusAnimationData> = new Map<string, StatusAnimationData>();
    private _itemToAniNames: Map<string, string[]> = new Map<string, string[]>();
    private _playAfterLoad: boolean = true;
    private _currentPlayingAniName = "";
    private _currentPlayItemId = "";

    public getCurrentAniItemId(): string {
        return this._currentPlayItemId;
    }

    public getAllAnimationIds(): string[] {
        return Array.from(this._itemToAniNames.keys());
    }

    public constructor(owner: AvatarController) {
        this._owner = owner;
    }

    public finalize() {
        this._itemToAniNames.clear();

        this._animationDatas.forEach(aniData => {
            aniData.finalize();
        });

        this._playAfterLoad = true;
        this._currentPlayingAniName = "";
        this._currentPlayItemId = "";
    }

    //-----------------------------------------------------------------------------------
    // loadAnimation
    //-----------------------------------------------------------------------------------
    public async LoadAndPlayAnimation(itemId: string, playAfterLoad: boolean = true, playAniTag: string = "", hasPlayTimeGap: boolean = false): Promise<void> {
        this._currentPlayItemId = itemId;
        if (this._itemToAniNames.get(itemId)) {
            if (playAfterLoad) {
                this._playAnimationByItemId(itemId, playAniTag, hasPlayTimeGap);
            }
            return;
        }

        this._playAfterLoad = playAfterLoad;
        await this._owner.getAssetLoader().loadAvatarAsset(itemId, (animationImportResult) => {
            if (animationImportResult) {
                this._addAnimationDatasFromImportResult(itemId, animationImportResult.meshes, animationImportResult.skeletons, animationImportResult.animationGroups);

                //Animation Play
                if (this._playAfterLoad) {
                    this._playAnimationByItemId(itemId, playAniTag, hasPlayTimeGap);
                }

            }
            else {
                console.error(`AvatarAnimation.LoadAndPlayAnimation() => no import result!!! check item ${itemId}`);
            }
        });

        this._owner.getAvatarParticle().playAnimation(itemId);

    }

    private _retargetAnimationGroup(animationGroup: BABYLON.AnimationGroup, targetSkeleton: BABYLON.Nullable<BABYLON.Skeleton>) {
        if (targetSkeleton) {
            animationGroup.targetedAnimations.forEach((targetedAnimation) => {
                const newTargetBone = targetSkeleton.bones.filter((bone) => { return bone.name === targetedAnimation.target.name; })[0];
                if (newTargetBone) {
                    targetedAnimation.target = newTargetBone.getTransformNode();
                }
            });
        }
    }

    private _playAnimationByItemId(itemId: string, aniTag: string = "", hasPlayTimeGap: boolean = false) {
        const aniNames = this._itemToAniNames.get(itemId);
        if (aniNames && aniNames.length > 0) {
            let aniName = aniNames[0];
            const tagAniIdx = aniNames.findIndex((n) => n.endsWith(aniTag));
            if (aniTag && tagAniIdx >= 0) {
                aniName = aniNames[tagAniIdx];
            }

            if (hasPlayTimeGap) {
                this.playAnimation(aniName, false, undefined, hasPlayTimeGap, true);
            } else {
                this.playAnimation(aniName);
            }
        }
    }

    private _addAnimationDatasFromImportResult(itemId: string, meshes: BABYLON.AbstractMesh[], skeletons: BABYLON.Skeleton[], animationGroups: BABYLON.AnimationGroup[]): StatusAnimationData[] {
        const aniDatas: StatusAnimationData[] = [new StatusAnimationData(), new StatusAnimationData(), new StatusAnimationData()];

        //animaitongroup 리타겟팅 ==> 에니메이션 그룹을 분할해야하나?
        animationGroups.forEach(aniGroup => {
            this._retargetAnimationGroup(aniGroup, this._owner.getAvatarSkeleton().getSkeleton());
            let dataIdx = 0;
            if (aniGroup.name.endsWith("_THUMBNAIL")) {
                dataIdx = 2;
            }
            else if (aniGroup.name.endsWith("_02")) {
                dataIdx = 1;
            }

            aniDatas[dataIdx].statusAni = aniGroup;
        });


        //상태에니에 사용하는 오브젝트 세팅
        const allMeshes = meshes;
        for (let ii = allMeshes.length - 1; ii >= 0; --ii) {
            const rootMesh = allMeshes[ii];
            rootMesh.getChildMeshes().forEach((childMesh) => {

                //메쉬 갯수 늘리고 이름 포함 하는 메쉬로.....
                if (childMesh.name.startsWith("STATUS_OBJ01_MESH")) {
                    if (null !== aniDatas[0] && null === aniDatas[0].statusObejctRoot) {
                        const statusObjectRoot = this._findStatusObjectRootNode(childMesh);
                        statusObjectRoot.parent = this._owner.getModelRootTransform();
                        this._owner.setDefaultRootTransform(statusObjectRoot);
                        statusObjectRoot.setEnabled(false);
                        aniDatas[0].statusObejctRoot = statusObjectRoot;
                        aniDatas[0].statusObjectSkeleton = this._findStatusObjectSkeletonFromRoot(statusObjectRoot);
                    }

                    if (null !== aniDatas[2] && null === aniDatas[2].statusObejctRoot) {
                        const statusObjectRoot = this._findStatusObjectRootNode(childMesh);
                        statusObjectRoot.parent = this._owner.getModelRootTransform();
                        this._owner.setDefaultRootTransform(statusObjectRoot);
                        statusObjectRoot.setEnabled(false);
                        aniDatas[2].statusObejctRoot = statusObjectRoot;
                        aniDatas[2].statusObjectSkeleton = this._findStatusObjectSkeletonFromRoot(statusObjectRoot);
                    }
                    this._setAlwaysAnimating(childMesh);
                }
                else if (childMesh.name.startsWith("STATUS_OBJ02_MESH")) {
                    if (null !== aniDatas[1] && null === aniDatas[1].statusObejctRoot) {
                        const statusObjectRoot = this._findStatusObjectRootNode(childMesh);
                        statusObjectRoot.parent = this._owner.getModelRootTransform();
                        this._owner.setDefaultRootTransform(statusObjectRoot);
                        statusObjectRoot.setEnabled(false);
                        aniDatas[1].statusObejctRoot = statusObjectRoot;
                        aniDatas[1].statusObjectSkeleton = this._findStatusObjectSkeletonFromRoot(statusObjectRoot);
                    }
                    this._setAlwaysAnimating(childMesh);
                }
            });
        }


        //사용하지 않는 메쉬 제거
        meshes.forEach(mesh => {
            if (!aniDatas[0].isStatusObjectMesh(mesh) && !aniDatas[1].isStatusObjectMesh(mesh)) {
                mesh.dispose();
            }
        });

        //사용하지 않는 skeleton 제거
        skeletons.forEach(sk => {
            if (!aniDatas[0].isStatusObjectSkeleton(sk) && !aniDatas[1].isStatusObjectSkeleton(sk)) {
                sk.dispose();
            }
        });

        // 사용하지 않는 AniData 제거
        for (let ii = 2; ii >= 0; --ii) {
            if (null === aniDatas[ii].statusAni) {
                aniDatas.splice(ii, 1);
            }
        }

        //에니데이터 추가
        this.addAniDatas(itemId, aniDatas);

        return aniDatas;
    }

    private _setAlwaysAnimating(mesh: BABYLON.AbstractMesh) {
        const info = mesh.getBoundingInfo();
        const minPt = BABYLON.Vector3.Minimize(info.boundingBox.minimum, BABYLON.Vector3.Zero());
        const maxPt = BABYLON.Vector3.Maximize(info.boundingBox.maximum, BABYLON.Vector3.Zero());
        mesh.setBoundingInfo(new BABYLON.BoundingInfo(minPt, maxPt, mesh.getWorldMatrix()));
        //mesh.alwaysSelectAsActiveMesh = true;
    }

    private _findStatusObjectRootNode(mesh: BABYLON.AbstractMesh): BABYLON.TransformNode {
        let root: BABYLON.TransformNode = mesh;
        if (root.parent !== null && root.parent.name.startsWith("STATUS_OBJ")) {
            root = root.parent as BABYLON.TransformNode;
        }

        return root;
    }

    private _findStatusObjectSkeletonFromRoot(root: BABYLON.TransformNode): BABYLON.Skeleton | null {
        if (root instanceof BABYLON.AbstractMesh) {
            return root.skeleton;
        }
        else {
            const childMeshes = root.getChildMeshes();
            if (childMeshes.length > 0) {
                return childMeshes[0].skeleton;
            }
        }

        return null;
    }

    //-----------------------------------------------------------------------------------
    // Animation Play 관련
    //-----------------------------------------------------------------------------------
    public playAnimation(aniName: string, loop: boolean = true, aniSpeed: number = 1.0, hasPlayTimeGap: boolean = false, blending: boolean = false) {
        const aniData = this._animationDatas.get(aniName);
        if (aniData && aniData.statusAni) {
            //기존 플레이 상태 오브젝트 끄고 플레이 스탑
            if (this._currentPlayingAniName) {
                const curAniData = this._animationDatas.get(this._currentPlayingAniName);
                if (curAniData) {
                    curAniData.showStatusObject(false); //메쉬끄기..
                }
            }
            this._stopAllAnimaitons();

            //ani play
            this._currentPlayingAniName = aniName;
            aniData.showStatusObject(true);

            if (blending) {
                for (const ta of aniData.statusAni.targetedAnimations) {
                    ta.animation.enableBlending = true;
                    ta.animation.blendingSpeed = 0.1;
                }
            }

            aniData.statusAni.start(loop, aniSpeed);
            if (hasPlayTimeGap) {
                const waitTime = Constants.IDLE_ANIMATION_TIME_GAP_MIN + Math.random() * (Constants.IDLE_ANIMATION_TIME_GAP_MAX - Constants.IDLE_ANIMATION_TIME_GAP_MIN);
                aniData.setFinishCallbackOnce(() => {
                    window.setTimeout(() => {
                        this.playAnimation(aniName, loop, aniSpeed, hasPlayTimeGap, blending);
                    }, waitTime);
                });
            }

            setTimeout(() => {
                this._owner.resetCanvasOffsetPos();
            }, 100);
        }
    }

    public hasAnimation(aniName: string): boolean {
        return this._animationDatas.has(aniName);
    }

    public addAniDatas(itemId: string, aniDatas: StatusAnimationData[]) {
        const aniNames: string[] = [];
        for (let ii = 0; ii < aniDatas.length; ++ii) {
            if (aniDatas[ii].statusAni) {
                const aniName = aniDatas[ii].statusAni!.name;
                this._animationDatas.set(aniDatas[ii].statusAni!.name, aniDatas[ii]);
                aniNames.push(aniName);
                //기존이름 변경 (플레이는 영향없도록 아래에서, Debug용)
                aniDatas[ii].statusAni!.name = aniName + ` (${this._owner.getAvatarId()})`;
            }
        }

        this._itemToAniNames.set(itemId, aniNames);
        this._owner.refreshCustomInspectorProperties();
    }

    private _stopAllAnimaitons() {
        this._animationDatas.forEach(
            aniData => {
                aniData.statusAni?.stop();
            }
        );

        //this._owner.getAvatarParticle().stopAnimation();
    }

    //-----------------------------------------------------------------------------------
    // Custom Inspector
    //-----------------------------------------------------------------------------------
    public refreshCustomInspectorProperties(inspectableCustomProperties: BABYLON.IInspectable[]) {
        inspectableCustomProperties.push({
            label: "Load Animation (GLB)",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadAnimation_File(file);
            },
            accept: ".glb"
        });

        this._animationDatas.forEach((_, k) => {
            inspectableCustomProperties.push({
                label: `Play Ani (${k})`,
                propertyName: "",
                type: BABYLON.InspectableType.Button,
                callback: () => {
                    this.playAnimation(k, true, 1.0);
                }
            });
        });
    }

    private _loadAnimation_File(file: File): void {
        BABYLON.SceneLoader.ImportMesh("", "", file, this._owner.getScene(), (meshes, _particleSystems, skeletons, animationGroups, _transformNodes, _geometries, _lights) => {
            const itemId = BABYLON.GUID.RandomId();
            this._addAnimationDatasFromImportResult(itemId, meshes, skeletons, animationGroups);

            //Animation Play
            if (this._playAfterLoad) {
                this._playAnimationByItemId(itemId);
            }
        });
    }

    //-----------------------------------------------------------------------------------
    // Icon Generator 지원
    //-----------------------------------------------------------------------------------
    public async loadAndPlayAnimationFromAssetBuffer(arrayBufferView: ArrayBufferView, name: string) {
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", arrayBufferView, this._owner.getScene(), undefined, ".glb", name);
        const itemId = BABYLON.GUID.RandomId();
        this._addAnimationDatasFromImportResult(itemId, result.meshes, result.skeletons, result.animationGroups);

        //Animation Play
        if (this._playAfterLoad) {
            this._playAnimationByItemId(itemId);
        }
    }
}