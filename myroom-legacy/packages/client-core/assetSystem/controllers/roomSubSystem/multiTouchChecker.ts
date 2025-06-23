import { ConstantsEx } from "../../constantsEx";

// addEventListener 에 단순 function만 넣을수 있기 때문에, singlton처럼 처리된다.
// removeEventListener 를 하려면, 어쩔수 없이 함수를 정의해서 넣어야 하기 때문.
export class MultiTouchChecker {
    public static _nowMultiTouching: boolean = false;
    private _canvas: HTMLCanvasElement | null | undefined;
    public constructor(canvas: HTMLCanvasElement | null | undefined) {
        this._canvas = canvas;
        this._register();
    }

    public finalize() {
        this._unregister();
    }

    public isMultiTouching(): boolean {
        return MultiTouchChecker._nowMultiTouching;
    }

    private _register() {
        if (!this._canvas) {
            this._canvas = document.getElementById(ConstantsEx.CANVAS_ID) as HTMLCanvasElement;
        }
        if (!this._canvas) {
            console.warn("MultiTouchChecker:no renderCanvas");
            return;
        }
        this._canvas.addEventListener('touchstart', this._onTouchCheck);
        this._canvas.addEventListener('touchend', this._onTouchCheck);
        this._canvas.addEventListener('touchcancel', this._onTouchCheck);
    }
    private _unregister() {
        if (!this._canvas) {
            return;
        }
        this._canvas.removeEventListener('touchstart', this._onTouchCheck);
        this._canvas.removeEventListener('touchend', this._onTouchCheck);
        this._canvas.removeEventListener('touchcancel', this._onTouchCheck);
    }

    private _onTouchCheck(event: TouchEvent) {
        MultiTouchChecker._nowMultiTouching = event.touches.length > 1;
    }

}