import Webcam from "react-webcam";
import { FaceLandmarker, FilesetResolver, PoseLandmarker, PoseLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { useRef, useState, useEffect, useMemo } from "react";
import { Quaternion, Matrix } from "@babylonjs/core";
import { SceneManager } from '@/common/utils/client';
import { ISetFaceMorphData, ConstantsEx } from 'client-core';
import style from './style.module.scss';

type RunningMode = "IMAGE" | "VIDEO";
type voidFunction = () => void;
interface IFaceExpressionResponse {
    blendshape_name: Array<string>;
    mediapipe_result: Array<number>;
    init_values: Array<number>;
    prev_face_rot: Quaternion;
    face_rot: Quaternion;
}

export interface IFace3DAPI {
    getMorph(names: Array<string>): Array<number>;
    setMorph(data: Array<ISetFaceMorphData>): void;
    applyHeadRot(head: number, pitch: number, yaw: number): void;
    setUpdateRoutine(routine: voidFunction, set: boolean): void;
    setIdleUpdateRoutine(routine: voidFunction, set: boolean): void;
    dispose(): void;
}

export class FaceController {
    private _api: IFace3DAPI;
    private _faceLandmarker: FaceLandmarker | null = null;
    private _poseLandmarker: PoseLandmarker | null = null;
    private _usePoseDetector: boolean = false;
    private _runningMode: RunningMode = "IMAGE";
    private _setUiChangedVersion: any;
    private _webcamRef: any;
    private _volumeRef: any;

    private _lastVideoTime = -1;
    private _lastTime = 0;
    private _faceUpdate: voidFunction | null = null;
    private calcPeriod = 100;
    private _elapseTime: number = 0;
    private _faceExpressionResponse: IFaceExpressionResponse | null = null;
    private _prevTime: number = 0;
    private _deltaTime: number = 0;

    private _updateFunc: voidFunction;
    private _idleUpdateFunc: voidFunction;

    public get webcamRef(): any {
        return this._webcamRef;
    }
    public get volumeRef(): any {
        return this._volumeRef;
    }
    public get runningMode(): RunningMode {
        return this._runningMode;
    }

    constructor(api: IFace3DAPI, period?:number) {
        this._api = api;

        if (period) this.calcPeriod = Math.max(100, period);
        // 일부 안드로이드폰에서 느릴때, 결과가 튀는 경우가 생겨서, 주기를 길게 한다.
        else if (ConstantsEx.isMobile() && !ConstantsEx.isIOS()) this.calcPeriod = 200;

        console.log("calcPeriod", this.calcPeriod);

        this._updateFunc = () => this._updateRoutine();
        this._idleUpdateFunc = () => this._faceUpdate?.();
        api.setUpdateRoutine(this._updateFunc, true);
        api.setIdleUpdateRoutine(this._idleUpdateFunc, true);
    }

    dispose() {
        console.log("FaceController:dispose");

        this._faceLandmarker?.close();
        this._faceLandmarker = null;
        this._poseLandmarker?.close();
        this._poseLandmarker = null;

        this._api.setUpdateRoutine(this._updateFunc, false);
        this._api.setIdleUpdateRoutine(this._idleUpdateFunc, false);

        this._api.dispose();
    }

    async initializeMediapipe() {
        if (this._faceLandmarker) return;

        const mode = this._runningMode;
        console.log("initializeMediapipe1");
        const filesetResolver = await FilesetResolver.forVisionTasks(
            // path/to/wasm/root
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        //alert("initializeMediapipe2");

        this._faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: "./face/face_landmarker.task",
                //modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                //delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: mode,
            numFaces: 1
        });

        if (this._usePoseDetector) {
            this._poseLandmarker = await PoseLandmarker.createFromOptions(
                filesetResolver,
                {
                    // heavy로 하면 정확도는 좀더 나아지지만, 모바일에서 메모리 이슈로 죽네.
                    baseOptions: {
                        modelAssetPath: "./face/pose_landmarker_lite.task",
                        //delegate: "GPU"
                    },
                    runningMode: mode,
                    numPoses: 1
                });
        }

        console.log("initializeMediapipe2");
        this.updateUi();
    }

    isLoaded(): boolean {
        return this._faceLandmarker !== null;
    }

    use() {

        const [uiChangedVersion, setUiChangedVersion] = useState<number>(0);
        this._setUiChangedVersion = setUiChangedVersion;

        this._webcamRef = useRef(null);
        this._volumeRef = useRef(null);
    }

    updateUi() {
        this._setUiChangedVersion?.((v: number) => v + 1);
    }

    changeRunningMode(mode: RunningMode) {
        this._runningMode = mode;
        this.updateUi();

        // Activate the webcam stream.
        // getUserMedia이걸 하면, ipad에서 안되는 경우가 있다.
        //navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        this._faceLandmarker?.setOptions({ runningMode: mode }).then(() => {
            if (this._poseLandmarker) {
                this._poseLandmarker.setOptions({ runningMode: mode }).then(() => {
                    console.log("runningMode changed", mode);
                    if (this._webcamRef && this._webcamRef.current) this._onFaceUpdate(this._webcamRef.current as Webcam);

                    if (mode === "VIDEO") this._startAudioProcessing();
                });
            } else {
                console.log("runningMode changed", mode);
                if (this._webcamRef && this._webcamRef.current) this._onFaceUpdate(this._webcamRef.current as Webcam);

                if (mode === "VIDEO") this._startAudioProcessing();
            }
        });
    }

    private async _startAudioProcessing() {
        // 사용자의 마이크 접근 권한을 요청합니다.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        // FFT 사이즈를 설정합니다 (32, 64, 128, 256, 512 등).
        analyser.fftSize = 256;

        // 주파수 데이터를 저장할 배열을 생성합니다.
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // 오디오 소스를 분석기에 연결합니다.
        source.connect(analyser);

        const self = this;
        // 볼륨 레벨을 업데이트하는 함수를 정의합니다.
        function updateVolume() {
            // 주파수 데이터를 가져옵니다.
            analyser.getByteFrequencyData(dataArray);

            // 데이터의 평균 볼륨을 계산합니다.
            let sum = 0;
            for (const value of dataArray) {
                sum += value;
            }
            const averageVolume = sum / dataArray.length;

            // 볼륨 미터 UI 엘리먼트를 가져옵니다.
            if (self._volumeRef && self._volumeRef.current) {
                const volumeMeter = self._volumeRef.current as HTMLDivElement;
                // 볼륨 레벨을 UI에 표시합니다.
                if (volumeMeter) {
                    volumeMeter.style.width = `${averageVolume}%`;
                    volumeMeter.style.height = '40px';
                    volumeMeter.style.backgroundColor = 'cyan';
                }
            }

            // 다음 프레임을 위해 함수를 반복 호출합니다.
            requestAnimationFrame(updateVolume);
        }

        // 볼륨 업데이트 함수를 호출하여 시작합니다.
        updateVolume();
    }


    private _onFaceUpdate(webCam: Webcam | null) {
        if (webCam) {
            const cam = webCam;
            let nowInMs = performance.now();
            const canvas = cam.getCanvas();
            //console.log("cam.video.readyState", cam?.video?.readyState);
            //cam.video.readyState >=3 이어야 mediapipe에서 에러가 안생긴다.
            if (this._faceLandmarker && (!this._usePoseDetector || this._poseLandmarker) && canvas && cam.video && cam.video.readyState >= 3 && nowInMs - this._lastTime >= this.calcPeriod && this._lastVideoTime !== cam.video.currentTime) {
                this._lastTime = nowInMs;
                this._lastVideoTime = cam.video.currentTime;
                //runDetector = false;
                //faceDetectMode = !faceDetectMode;
                const ctx = canvas?.getContext('2d', { willReadFrequently: true });
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                //if (faceDetectMode) {
                const results = this._faceLandmarker.detectForVideo(imageData, nowInMs);
                if (results.faceBlendshapes && results.faceBlendshapes.length == 1) {
                    //console.log("matrix", results.facialTransformationMatrixes[0]);
                    const faceMat = Matrix.FromArray(results.facialTransformationMatrixes[0].data);
                    let rot = Quaternion.Identity();
                    faceMat.decompose(undefined, rot);
                    // 오른손 좌표계. y-up
                    //console.log("faceMat", rot.toEulerAngles());
                    let response: IFaceExpressionResponse = {
                        blendshape_name: new Array<string>(),
                        mediapipe_result: new Array<number>(),
                        init_values: [],
                        prev_face_rot: rot,
                        face_rot: rot,
                    }
                    for (const shape of results.faceBlendshapes[0].categories) {
                        response.blendshape_name.push(shape.categoryName);
                        //console.log(shape.categoryName);
                        let score = Math.max(Math.min(shape.score, 1), 0);

                        if (shape.categoryName.includes("eyeBlink") ||
                            shape.categoryName.includes("eyeLookDown") ||
                            shape.categoryName.includes("eyeSquint")) {
                            // 너무 작은 눈이 나오지 않게
                            const THRESHOLD = 0.6;
                            if (score < THRESHOLD) {
                                score /= THRESHOLD;
                                score = score * score * score;
                                score *= THRESHOLD;
                                //console.log(shape.categoryName, [shape.score, score]);
                            }

                            if (shape.categoryName.includes("eyeBlink")) {
                                score = Math.min(score, 0.55);
                            }

                        } else if (shape.categoryName.includes("browDown")) {
                            // 눈썹 모으는게 안됨.
                            const MAX_VALUE = 0.4;
                            score = Math.min(1, score / MAX_VALUE);
                        } else if (shape.categoryName.includes("browInnerUp")) {
                            // 너무 팔자 눈썹이 됨.
                            score = Math.min(0.5, score);
                        } else if (shape.categoryName.includes("jawOpen")) {
                            //console.log(shape.categoryName, score);
                            // 살짝 입을 벌리게 한다.
                            score = Math.max(0.15, score);
                        }
                        response.mediapipe_result.push(score);
                    }
                    this._setFaceExpressionResponse(response);
                    this._elapseTime = 0;
                }
                //} else {
                // this._poseLandmarker?.detectForVideo(imageData, nowInMs, (result) => {
                //     this._onRenderBones(result);
                // });
                //}
            }
        }
        //window.requestAnimationFrame(() => onFaceUpdate(webCam));
        if (!this._faceUpdate) {
            this._faceUpdate = () => this._onFaceUpdate(webCam);
        }
    }

    private _setFaceExpressionResponse(data: IFaceExpressionResponse) {
        if (this._faceExpressionResponse) data.prev_face_rot = this._faceExpressionResponse.face_rot;

        this._faceExpressionResponse = data;
        this._faceExpressionResponse.init_values = [];
        const blendshape_name: Array<string> = this._faceExpressionResponse.blendshape_name;
        const result = this._api.getMorph(blendshape_name);
        this._faceExpressionResponse.init_values = result;
    }

    private _checkDeltaTime() {
        const curTime = new Date().getTime();
        if (this._prevTime !== 0) {
            this._deltaTime = curTime - this._prevTime;
        }
        this._prevTime = curTime;
    }

    private _updateRoutine() {
        const ANIM_PERIOD = this.calcPeriod / 1.5;
        if (this._faceExpressionResponse) {
            this._checkDeltaTime();
            this._elapseTime += this._deltaTime;
            const lerpRatio = Math.max(0, Math.min(1, this._elapseTime / ANIM_PERIOD));
            const blendshape_name: Array<string> = this._faceExpressionResponse.blendshape_name;
            const mediapipe_result: Array<number> = this._faceExpressionResponse.mediapipe_result;
            const init_values: Array<number> = this._faceExpressionResponse.init_values;

            const setData: Array<ISetFaceMorphData> = [];
            for (let i = 0; i < blendshape_name.length; i++) {
                const value = Math.max(Math.min(mediapipe_result[i], 1), 0);
                setData.push({
                    name: blendshape_name[i],
                    value: init_values[i] + (value - init_values[i]) * lerpRatio,
                });

            }
            this._api.setMorph(setData);

            const headRot = Quaternion.Slerp(this._faceExpressionResponse.prev_face_rot, this._faceExpressionResponse.face_rot, lerpRatio).toEulerAngles();
            const ANGLE_LIMIT = Math.PI / 180 * 30;
            const rx = Math.min(ANGLE_LIMIT, Math.max(-ANGLE_LIMIT, headRot.x - Math.PI / 180 * 15));
            const ry = Math.min(ANGLE_LIMIT, Math.max(-ANGLE_LIMIT, headRot.y));
            const rz = Math.min(ANGLE_LIMIT, Math.max(-ANGLE_LIMIT, headRot.z));
            this._api.applyHeadRot(ry, -rz, rx);
        }
    }
}

class MyRoomFaceAPI implements IFace3DAPI {
    private _checkId1: number | null = null;
    private _checkId2: number | null = null;
    dispose() {
        this._stopCheck1();
        this._stopCheck2();
    }
    getMorph(names: Array<string>): Array<number> {
        return SceneManager.Avatar?.getFaceMorphValues(names) ?? [];
    }
    setMorph(data: Array<ISetFaceMorphData>): void {
        SceneManager.Avatar?.setFaceMorphValues(data);
    }
    applyHeadRot(head: number, pitch: number, yaw: number): void {
        SceneManager.Avatar?.applyHeadRotation(head, pitch, yaw);
    }
    setUpdateRoutine(routine: voidFunction, set: boolean): void {
        let api = SceneManager.Avatar;
        if (api) {
            api.setUpdateRoutine(routine, set);
        } else {
            if (set) {
                this._checkId1 = window.setInterval(() => {
                    api = SceneManager.Avatar;
                    if (api) {
                        api.setUpdateRoutine(routine, true);
                        this._stopCheck1();
                    }
                }, 100);
            } else {
                this._stopCheck1();
            }
        }
    }
    setIdleUpdateRoutine(routine: voidFunction, set: boolean): void {
        let api = SceneManager.Avatar;
        if (api) {
            api.setIdleUpdateRoutine(routine, set);
        } else {
            if (set) {
                this._checkId2 = window.setInterval(() => {
                    api = SceneManager.Avatar;
                    if (api) {
                        api.setIdleUpdateRoutine(routine, true);
                        this._stopCheck2();
                    }
                }, 100);
            } else {
                this._stopCheck2();
            }
        }
    }

    private _stopCheck1() {
        if (this._checkId1) {
            window.clearInterval(this._checkId1);
            this._checkId1 = null;
        }
    }
    private _stopCheck2() {
        if (this._checkId2) {
            window.clearInterval(this._checkId2);
            this._checkId2 = null;
        }
    }
}

export const FaceWebCam = (props: any) => {

    const { isReady, showCamera, period, ...restProps } = props;

    const faceController = useMemo(() => {
        const controller = new FaceController(new MyRoomFaceAPI(), period);
        controller.initializeMediapipe();
        return controller;
    }, []);

    faceController.use();

    useEffect(() => {
        return () => {
            faceController.dispose();
        };
    }, [faceController]);

    const onStop = () => {
        window.location.reload();
    }

    return (
        <div {...restProps}>
            {faceController.runningMode === "VIDEO" && <Webcam className={showCamera ? style.webcam : style.webcamHide} ref={faceController.webcamRef} mirrored={true} />}
            {faceController.runningMode === "VIDEO" && <div className={style.volume} ref={faceController.volumeRef} />}

            {faceController.runningMode === "IMAGE" && (faceController.isLoaded() && isReady) && <button className={style.startbutton} onClick={() => { faceController.changeRunningMode("VIDEO"); }}>Camera<br />Start</button>}
            {faceController.runningMode === "VIDEO" && !showCamera && <button className={style.startbutton} onClick={() => { onStop(); }}>Camera<br />Stop</button>}
        </div>
    );
}