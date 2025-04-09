import * as BABYLON from "@babylonjs/core";
import { AvatarController } from "../avatarController";
import { StatusAnimationData } from "./avatarAnimation";

export class AvatarSkeleton {
    private _owner: AvatarController;
    private _skeleton: BABYLON.Nullable<BABYLON.Skeleton> = null;
    private _assetId: string = "";

    public getSkeleton(): BABYLON.Nullable<BABYLON.Skeleton> {
        return this._skeleton;
    }

    public getAssetId(): string {
        return this._assetId;
    }

    public constructor(owner: AvatarController) {
        this._owner = owner;
    }

    public finalize() {
        if (this._skeleton) {
            this._skeleton.dispose();
        }
    }

    public async loadSkeleton(assetId: string): Promise<void> {
        this._assetId = assetId;
        await this._owner.getAssetLoader().loadAvatarAsset(assetId, (skeletonImportResult) => {
            if (skeletonImportResult) {
                skeletonImportResult.meshes.forEach(mesh => {
                    if (mesh.parent === null) {
                        mesh.parent = this._owner.getModelRootTransform();
                        const childMeshes = mesh.getChildMeshes();
                        for (let cc = 0; cc < childMeshes.length; ++cc) {
                            if (childMeshes[cc].subMeshes.length > 0) {
                                childMeshes[cc].dispose(); //export를 위해 넣은 dummy mesh는 제거한다
                            }
                        }
                    }
                });

                this._skeleton = skeletonImportResult.skeletons[0];
                this._skeleton.name = `Avatar (${this._owner.getAvatarId()})`;

                const aniDatas: StatusAnimationData[] = [];
                for (let ii = 0; ii < skeletonImportResult.animationGroups.length; ++ii) {
                    const data = new StatusAnimationData();
                    data.statusAni = skeletonImportResult.animationGroups[ii];
                    aniDatas.push(data);
                }

                this._owner.getAvatarAnimation().addAniDatas("", aniDatas); //스켈레톤이 가지고 있는 ani는 빈것으로 하자
            }
        });
    }

    private _loadSkeleton_File(file: File): void {
        const successHandler: BABYLON.SceneLoaderSuccessCallback = (meshes, _particleSystems, skeletons, animationGroups, _transformNodes, _geometries, _lights) => {
            meshes.forEach(mesh => {
                if (mesh.parent === null) {
                    mesh.parent = this._owner.getModelRootTransform();
                    const childMeshes = mesh.getChildMeshes();
                    for (let cc = 0; cc < childMeshes.length; ++cc) {
                        if (childMeshes[cc].subMeshes.length > 0) {
                            childMeshes[cc].dispose(); //export를 위해 넣은 dummy mesh는 제거한다
                        }
                    }
                }
            });
            this._skeleton = skeletons[0];
            this._skeleton.name = `Avatar (${this._owner.getAvatarId()})`;
            const aniDatas: StatusAnimationData[] = [];
            for (let ii = 0; ii < animationGroups.length; ++ii) {
                const data = new StatusAnimationData();
                data.statusAni = animationGroups[ii];
                aniDatas.push(data);
            }
            this._owner.getAvatarAnimation().addAniDatas("", aniDatas);
        };

        BABYLON.SceneLoader.ImportMesh("", "", file, this._owner.getScene(), successHandler);
    }

    public refreshCustomInspectorProperties(inspectableCustomProperties: BABYLON.IInspectable[]) {
        inspectableCustomProperties.push({
            label: "Load Skeleton (GLB)",
            propertyName: "",
            type: BABYLON.InspectableType.FileButton,
            fileCallback: (file) => {
                this._loadSkeleton_File(file);
            },
            accept: ".glb"
        });
    }

    //Icon Generator 지원
    public async loadSkeletonFromAssetBuffer(arrayBufferView: ArrayBufferView) {

        const file = new File([arrayBufferView], "skel", { type: "application/octet-stream" });
        //this._loadSkeleton_File(file);



        const successHandler: BABYLON.SceneLoaderSuccessCallback = (meshes, _particleSystems, skeletons, animationGroups, _transformNodes, _geometries, _lights) => {
            meshes.forEach(mesh => {
                if (mesh.parent === null) {
                    mesh.parent = this._owner.getModelRootTransform();
                    // const childMeshes = mesh.getChildMeshes();
                    // for (let cc = 0; cc < childMeshes.length; ++cc) {
                    //     if (childMeshes[cc].subMeshes.length > 0) {
                    //         childMeshes[cc].dispose(); //export를 위해 넣은 dummy mesh는 제거한다
                    //     }
                    // }
                }
            });
            this._skeleton = skeletons[0];
            this._skeleton.name = `Avatar (${this._owner.getAvatarId()})`;
            const aniDatas: StatusAnimationData[] = [];
            for (let ii = 0; ii < animationGroups.length; ++ii) {
                const data = new StatusAnimationData();
                data.statusAni = animationGroups[ii];
                aniDatas.push(data);
            }
            this._owner.getAvatarAnimation().addAniDatas("", aniDatas);
        };

        BABYLON.SceneLoader.ImportMesh("", "", file, this._owner.getScene(), successHandler, undefined, undefined, ".glb");


        /*
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", arrayBufferView, this._owner.getScene(), undefined, ".glb");
        result.meshes.forEach(mesh => {
            if (mesh.parent === null) {
                mesh.parent = this._owner.getModelRootTransform();
                // const childMeshes = mesh.getChildMeshes();
                // for (let cc = 0; cc < childMeshes.length; ++cc) {
                //     if (childMeshes[cc].subMeshes.length > 0) {
                //         childMeshes[cc].dispose(); //export를 위해 넣은 dummy mesh는 제거한다
                //     }
                // }
            }
        });
        this._skeleton = result.skeletons[0];
        this._skeleton.name = `Avatar (${this._owner.getAvatarId()})`;
        const aniDatas: StatusAnimationData[] = [];
        for (let ii = 0; ii < result.animationGroups.length; ++ii) {
            const data = new StatusAnimationData();
            data.statusAni = result.animationGroups[ii];
            aniDatas.push(data);
        }
        this._owner.getAvatarAnimation().addAniDatas("", aniDatas);
        */
    }

}