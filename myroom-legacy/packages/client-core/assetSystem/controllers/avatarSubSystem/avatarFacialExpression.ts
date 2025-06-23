import * as BABYLON from "@babylonjs/core";
import { AvatarController } from "../avatarController";
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { ISetFaceMorphData } from "client-core/assetSystem/definitions";

export enum EFacialParts {
    browInnerUp = "browInnerUp",
    browDownLeft = "browDownLeft",
    browDownRight = "browDownRight",
    browOuterUpLeft = "browOuterUpLeft",
    browOuterUpRight = "browOuterUpRight",
    eyeLookUpLeft = "eyeLookUpLeft",
    eyeLookUpRight = "eyeLookUpRight",
    eyeLookDownLeft = "eyeLookDownLeft",
    eyeLookDownRight = "eyeLookDownRight",
    eyeLookInLeft = "eyeLookInLeft",

    eyeLookInRight = "eyeLookInRight",
    eyeLookOutLeft = "eyeLookOutLeft",
    eyeLookOutRight = "eyeLookOutRight",
    eyeBlinkLeft = "eyeBlinkLeft",
    eyeBlinkRight = "eyeBlinkRight",
    eyeSquintRight = "eyeSquintRight",
    eyeSquintLeft = "eyeSquintLeft",
    eyeWideLeft = "eyeWideLeft",
    eyeWideRight = "eyeWideRight",
    cheekPuff = "cheekPuff",

    cheekSquintLeft = "cheekSquintLeft",
    cheekSquintRight = "cheekSquintRight",
    noseSneerLeft = "noseSneerLeft",
    noseSneerRight = "noseSneerRight",
    jawOpen = "jawOpen",
    jawForward = "jawForward",
    jawLeft = "jawLeft",
    jawRight = "jawRight",
    mouthFunnel = "mouthFunnel",
    mouthPucker = "mouthPucker",

    mouthLeft = "mouthLeft",
    mouthRight = "mouthRight",
    mouthRollUpper = "mouthRollUpper",
    mouthRollLower = "mouthRollLower",
    mouthShrugUpper = "mouthShrugUpper",
    mouthShrugLower = "mouthShrugLower",
    mouthClose = "mouthClose",
    mouthSmileLeft = "mouthSmileLeft",
    mouthSmileRight = "mouthSmileRight",
    mouthFrownLeft = "mouthFrownLeft",

    mouthFrownRight = "mouthFrownRight",
    mouthDimpleLeft = "mouthDimpleLeft",
    mouthDimpleRight = "mouthDimpleRight",
    mouthUpperUpLeft = "mouthUpperUpLeft",
    mouthUpperUpRight = "mouthUpperUpRight",
    mouthLowerDownLeft = "mouthLowerDownLeft",
    mouthLowerDownRight = "mouthLowerDownRight",
    mouthPressLeft = "mouthPressLeft",
    mouthPressRight = "mouthPressRight",
    mouthStretchLeft = "mouthStretchLeft",

    mouthStretchRight = "mouthStretchRight",
    tongueOut = "tongueOut",
}

class InitData {
    private _node: BABYLON.TransformNode;
    private _targetNode: BABYLON.TransformNode;
    private _pos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _rot: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _sca: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    constructor(animationNode: BABYLON.TransformNode, targetNode: BABYLON.TransformNode) {
        this._node = animationNode;
        this._targetNode = targetNode;
        this._pos = animationNode.position.clone();

        if (animationNode.rotationQuaternion) {
            this._rot = animationNode.rotationQuaternion.toEulerAngles();
        } else {
            this._rot = animationNode.rotation.clone();
        }

        this._sca = animationNode.scaling.clone();

        //console.log("InitData", this._node, this._pos, this._rot, this._sca);
    }

    public get name(): string {
        return this._node.name;
    }

    public getOffsetPos(): BABYLON.Vector3 {
        return this._node.position.subtract(this._pos);
    }
    public getOffsetRot(): BABYLON.Vector3 {
        if (this._node.rotationQuaternion) return this._node.rotationQuaternion.toEulerAngles().subtract(this._rot);
        return this._node.rotation.subtract(this._rot);
    }
    public getOffsetSca(): BABYLON.Vector3 {
        return this._node.scaling.subtract(this._sca);
    }

    // public getNode(): BABYLON.TransformNode {
    //     return this._node;
    // }
    public getTargetNode(): BABYLON.TransformNode {
        return this._targetNode;
    }

    public applyInit() {
        if (this._targetNode) {
            this._targetNode.position = this._pos.clone();
            // todo : 이 본들은 animation 이 기본적으로 없다고 가정한다. 있다면, apply를 할 필요가 없다.
            this._targetNode.rotationQuaternion = null;
            this._targetNode.rotation = this._rot.clone();
            this._targetNode.scaling = this._sca.clone();
        }
    }

    public applyDiff() {
        const node = this._targetNode;
        if (node) {
            node.position = node.position.add(this.getOffsetPos());
            node.rotationQuaternion = null;
            node.rotation = node.rotation.add(this.getOffsetRot());
            node.scaling = node.scaling.add(this.getOffsetSca());

            //console.log("applyDiff", initData.name, initData.getOffsetPos(), initData.getOffsetRot(), initData.getOffsetSca());
        }
    }
}

export class ExpressionInfo {
    private animationGroup: AnimationGroup;
    private _factor: number = 0.0;

    private startFrame: number = 0;
    private endFrame: number = 0;
    private _initDataList: Array<InitData> = [];

    public constructor(animationGroup: AnimationGroup, globalInitMap: Map<string, InitData>, targetSkeleton: BABYLON.Nullable<BABYLON.Skeleton>) {
        this.animationGroup = animationGroup;
        this._factor = 0.0;

        this.startFrame = Math.floor(animationGroup.from);
        this.endFrame = Math.floor(animationGroup.to);

        const checkMap = new Map<string, boolean>();
        animationGroup.targetedAnimations.forEach((targetedAnimation) => {
            if (targetSkeleton && targetedAnimation.target instanceof BABYLON.TransformNode) {
                const targetBone = targetSkeleton.bones.filter((bone) => { return bone.name === targetedAnimation.target.name; })[0];
                const node = targetBone?.getTransformNode();
                if (node) {
                    if (!checkMap.has(targetedAnimation.target.name)) {
                        //console.log("node", node);
                        checkMap.set(targetedAnimation.target.name, true);
                        this._initDataList.push(new InitData(targetedAnimation.target, node));
                    }

                    if (!globalInitMap.has(targetedAnimation.target.name)) globalInitMap.set(targetedAnimation.target.name, new InitData(node, node));
                }
            }
        });
    }

    public set factor(value: number) {
        this._factor = value;
    }
    public get factor(): number {
        return this._factor;
    }

    public getFrame(): number {
        let targetFrame = this.startFrame + (this.endFrame - this.startFrame) * this._factor;
        if (targetFrame < this.startFrame) targetFrame = this.startFrame;
        if (targetFrame > this.endFrame) targetFrame = this.endFrame;

        return targetFrame;
    }

    public run() {
        this.animationGroup.goToFrame(this.getFrame());
        this.animationGroup.play();
    }

    public applyDiff() {
        this._initDataList.forEach((initData) => {
            initData.applyDiff();
        });
    }

    public debug() {
        console.log("ExpressionInfo", this.animationGroup.name, this.factor);
        // this._initDataList.forEach((initData) => {
        //     console.log("applyDiff", initData.name, initData.getNode(), initData.getOffsetPos(), initData.getOffsetRot(), initData.getOffsetSca());
        // });
    }

    public finalize() {
        this.animationGroup.stop();
        this.animationGroup.dispose();
    }
}

export class AvatarFacialExpression {
    private _owner: AvatarController;

    private _expressionDic: Map<EFacialParts, ExpressionInfo> = new Map<EFacialParts, ExpressionInfo>();
    private _initMap: Map<string, InitData> = new Map<string, InitData>();

    private _isActivated: boolean = false;

    private _beforeRenderHandler?: any;

    private _facialAnimationAllInOneGlb: boolean = false;

    public constructor(owner: AvatarController) {
        this._owner = owner;

        owner._scene?.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.key == '2') {
                        this._expressionDic.forEach((expressionInfo) => {
                            expressionInfo.debug();
                        });
                    }
                    break;
            }
        });
    }

    public finalize() {
        this._unregisteLateUpdate();

        this._expressionDic.forEach((expressionInfo) => {
            expressionInfo.finalize();
        });

        this._expressionDic.clear();
        this._initMap.clear();
    }

    public async enableFacialExpression() {
        if (this._isActivated) {
            console.error(`enableFacialExpression() : already activated`);
            return;
        }

        const result = await this._loadFacialExpression();
        this._isActivated = true;

        return result;
    }

    public async disableFacialExpression() {
        if (!this._isActivated) {
            console.error(`disableFacialExpression() : already deactivated`);
            return;
        }

        this._isActivated = false;
        this.finalize();
    }

    private async _loadFacialExpression() {
        this._unregisteLateUpdate();

        if (this._facialAnimationAllInOneGlb) {
            //* 하나의 glb파일에 여러 AnimationGroup 존재하는 경우
            //const result = await this._loadAssetsFromURL("https://public.develop.colorver.se/resource/Facial_Test.glb");
            const result = await this._loadAssetsFromURL("https://public.develop.colorver.se/resource/ARkit_Avatar_Test.glb");
            //const result = await this._loadAssetsFromURL("https://public.develop.colorver.se/resource/ARkit_Avatar_Test_browInnerUp.glb");

            for (let facialPart of Object.values(EFacialParts)) {
                this.addAnimationGroup(result.animationGroups, facialPart);
            }

            const count = this._expressionDic.size;
            console.log('_loadFacialExpression Count of _expressionDic:', count);


            //사용하지 않는 메쉬 제거
            result.meshes.forEach(mesh => { mesh.dispose(); });

            //사용하지 않는 skeleton 제거
            result.skeletons.forEach(sk => { sk.dispose(); });

            //사용하지 않는 animationGroup 제거
            result.animationGroups.forEach(ag => {
                const parts = this._convertToEnum(ag.name);
                if (parts && !this._expressionDic.has(parts)) {
                    ag.dispose();
                }
            });
            /**/
        }
        else {
            // this._loadAsset(EFacialParts.jawOpen, "https://public.develop.colorver.se/resource/jawOpen.glb");
            // this._loadAsset(EFacialParts.browInnerUp, "https://public.develop.colorver.se/resource/browInnerUp.glb");
            // this._loadAsset(EFacialParts.cheekPuff, "https://public.develop.colorver.se/resource/cheekPuff.glb");

            const processes = [];

            for (let [key, value] of Object.entries(EFacialParts)) {
                processes.push(this._loadAsset(value, `https://public.develop.colorver.se/resource/exp3/${value}.glb`));
            }

            if (processes.length > 0) await Promise.all(processes);
        }

        // late update 이벤트 등록
        this._registeLateUpdate();
    }

    private async _loadAsset(facialPart: EFacialParts, glbUrl: string) {
        const result = await this._loadAssetsFromURL(glbUrl);
        this.addAnimationGroup(result.animationGroups, facialPart);

        //console.log("_loadAsset", facialPart, glbUrl, result);

        //사용하지 않는 메쉬 제거
        result.meshes.forEach(mesh => { mesh.dispose(); });

        //사용하지 않는 skeleton 제거
        result.skeletons.forEach(sk => { sk.dispose(); });

        //사용하지 않는 animationGroup 제거
        result.animationGroups.forEach(ag => {
            const parts = this._convertToEnum(ag.name);
            if (parts && !this._expressionDic.has(parts)) {
                ag.dispose();
            }
        });
    }

    private _registeLateUpdate() {
        this._unregisteLateUpdate();

        this._beforeRenderHandler = this._owner._scene.onBeforeRenderObservable.add(() => {
            this._initMap.forEach((initData) => {
                initData.applyInit();
            });
            this._expressionDic.forEach((expressionInfo) => {
                expressionInfo.run();
                expressionInfo.applyDiff();
            });
        });
    }

    private _unregisteLateUpdate() {
        if (this._beforeRenderHandler) {
            this._owner._scene.onBeforeRenderObservable.remove(this._beforeRenderHandler);
            this._beforeRenderHandler = undefined;
        }
    }

    public setFactor(target: EFacialParts, factor: number) {
        if (!this._isActivated)
            return;

        const info = this._expressionDic.get(target);
        if (!info) {
            console.error(`setFactor() : animGroupName='${target}' not found`);
            return;
        }

        info.factor = Math.min(Math.max(factor, 0), 1);
    }

    public getFactor(target: EFacialParts): number {
        if (!this._isActivated)
            return 0.0;

        const info = this._expressionDic.get(target);
        if (!info) {
            //console.error(`getFactor() : animGroupName='${target}' not found`);
            return 0.0;
        }

        return info.factor;
    }

    private _convertToEnum(value: string): EFacialParts | null {
        if (Object.values(EFacialParts).includes(value as EFacialParts)) {
            return value as EFacialParts;
        }
        return null;
    }


    private addAnimationGroup(animationGroups: AnimationGroup[], target: EFacialParts) {
        const targetName: string = target;
        const animationGroup = animationGroups.find((animationGroup) => { return animationGroup.name === targetName });
        if (!animationGroup) {
            console.error(`addAnimationGroup() : animGroupName='${target}' not found`);
            return;
        }

        const info = this._expressionDic.get(target);
        if (info) {
            console.error(`addAnimationGroup() : animGroupName='${target}' already exist`);
            return;
        }

        this._expressionDic.set(target, new ExpressionInfo(animationGroup, this._initMap, this._owner.getAvatarSkeleton().getSkeleton()));

        //this._retargetAnimationGroup(animationGroup, this._owner.getAvatarSkeleton().getSkeleton());
    }

    private async _loadAssetsFromURL(url: string): Promise<BABYLON.ISceneLoaderAsyncResult> {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "",
                "",
                url,
                this._owner._scene,
                (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {
                    resolve({
                        meshes: meshes,
                        particleSystems: particleSystems as BABYLON.IParticleSystem[],
                        skeletons: skeletons,
                        animationGroups: animationGroups,
                        transformNodes: transformNodes,
                        geometries: geometries,
                        lights: lights
                    });
                },
                null,
                (error) => {
                    console.error("AvatarFacialExpression::_loadAssetsFromURL() Error loading .glb file url='${url}': ", error);
                    reject(error);
                }
            );
        });
    }

    private _retargetAnimationGroup(animationGroup: BABYLON.AnimationGroup, targetSkeleton: BABYLON.Nullable<BABYLON.Skeleton>) {
        if (!targetSkeleton) {
            console.error(`_retargetAnimationGroup() : targetSkeleton is null`);
            return;
        }

        animationGroup.targetedAnimations.forEach((targetedAnimation) => {
            const newTargetBone = targetSkeleton.bones.filter((bone) => { return bone.name === targetedAnimation.target.name; })[0];
            if (newTargetBone)
                targetedAnimation.target = newTargetBone.getTransformNode();
        });

        animationGroup.enableBlending = false;
        animationGroup.isAdditive = false;
        animationGroup.weight = 1.0;
    }

    // names : animation 이름 배열
    // return : animation 이름 배열에 해당하는 factor 배열
    public getFaceMorphValues(names: Array<string>): Array<number> {
        if (!this._isActivated)
            return [];

        const result: number[] = [];

        names.forEach(name => {
            const parts = this._convertToEnum(name);
            if (!parts) {
                //console.error(`avatarFacialExpression::getFaceMorphValues() : Invalid parts. request aniGroupName='${name}'`);
                result.push(0.0);
                return;
            }

            if (!this._expressionDic.has(parts)) {
                console.error(`avatarFacialExpression::getFaceMorphValues() : Not found parts. request aniGroupName='${name}'`);
                result.push(0.0);
                return;
            }

            result.push(this.getFactor(parts));
        });

        return result;
    }
    // data : animation 이름과 factor 배열
    public setFaceMorphValues(datas: Array<ISetFaceMorphData>) {
        if (!this._isActivated)
            return;

        datas.forEach(data => {
            const parts = this._convertToEnum(data.name);
            if (!parts) {
                //console.error(`avatarFacialExpression::setFaceMorphValues() : Invalid parts. request aniGroupName='${data.name}'`);
                return;
            }

            if (!this._expressionDic.has(parts)) {
                console.error(`avatarFacialExpression::setFaceMorphValues() : Not found parts. request aniGroupName='${data.name}'`);
                return;
            }

            this.setFactor(parts, data.value);
        });
    }
}