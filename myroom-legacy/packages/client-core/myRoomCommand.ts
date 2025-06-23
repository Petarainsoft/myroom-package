import * as BABYLON from "@babylonjs/core";
import { IMyRoomCommandRecordingData, MyRoomCommandRecorder } from "./myRoomCommandRecorder";
import { MyRoomAPI } from "./myRoomAPI";

export class MyRoomCommand {
    private _name: string;
    private _isComplete: boolean = false;

    private _executeHanadler: (() => any) | null = null;
    private _executeHanadler_async: (() => Promise<any>) | null = null;
    private _result: any = undefined;

    public isComplete() {
        return this._isComplete;
    }

    public getResult() {
        return this._result;
    }

    public isAsync(): boolean {
        return null !== this._executeHanadler_async;
    }

    public execute() {
        if (!this.isAsync()) {
            try {
                if (this._executeHanadler) {
                    this._result = this._executeHanadler();
                }
            } catch (error) {
                console.error("MyRoomCommand:_executeHanadler error", error);
            }
            this._isComplete = true;
        }
        else {
            if (this._executeHanadler_async) {
                this._executeHanadler_async().then((res) => {
                    this._result = res;
                    this._isComplete = true;
                }).catch(error => {
                    this._isComplete = true;
                    console.error("MyRoomCommand:_executeHanadler_async error", error);
                });
            }
            else {
                this._isComplete = true;
            }
        }
    }

    public constructor(name: string, executeHandler: (() => any) | null, _executeHandler_async: (() => Promise<any>) | null) {
        this._name = name;
        this._executeHanadler = executeHandler;
        this._executeHanadler_async = _executeHandler_async;
    }
}

export class MyRoomCommandQueue {
    private _cmdQueue: MyRoomCommand[] = [];
    private _curCommand: MyRoomCommand | undefined = undefined;

    public constructor(scene: BABYLON.Scene, api: MyRoomAPI, recoding: boolean) {
        this._cmdQueue = [];
        if (recoding) {
            MyRoomCommandRecorder.createInstance(api);
            scene.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type) {
                    case BABYLON.KeyboardEventTypes.KEYDOWN:
                        if ("Enter" === kbInfo.event.code && kbInfo.event.ctrlKey) {
                            if (MyRoomCommandRecorder.isValid()) {
                                MyRoomCommandRecorder.getInstance().saveRecordingDatas();
                                console.log(">>>>>>>>>>>>>>>>> saved api commands");
                            }
                        }
                        break;
                }
            });
        }
    }

    public addCommand(handler: () => any, recData: IMyRoomCommandRecordingData) {
        this._cmdQueue.push(new MyRoomCommand(recData.commandName, handler, null));
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().addCommand_Api(recData);
        }
    }

    public addCommand_async(handler: () => Promise<any>, recData: IMyRoomCommandRecordingData) {
        this._cmdQueue.push(new MyRoomCommand(recData.commandName, null, handler));
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().addCommand_Api(recData);
        }
    }

    public updateCommands() {
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().processRecodingDatas();
        }

        if (this._curCommand && !this._curCommand.isComplete()) {
            return;
        }

        while (this._cmdQueue.length > 0) {
            this._curCommand = this._cmdQueue.shift();
            this._curCommand!.execute();
            if (!this._curCommand!.isComplete()) {
                break;
            }
        }
    }

    public loadRecordingData(file: File) {
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().loadRecordingDatas(file);
        }
    }

    public playRecordingData() {
        if (MyRoomCommandRecorder.isValid()) {
            MyRoomCommandRecorder.getInstance().startReplay();
        }
    }
}

