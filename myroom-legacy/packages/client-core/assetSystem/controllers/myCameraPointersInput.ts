import { ArcRotateCameraPointersInput, Nullable, PointerTouch } from "@babylonjs/core";

export class MyCameraPointersInput extends ArcRotateCameraPointersInput {

    public onMultiTouch(
        pointA: Nullable<PointerTouch>,
        pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        if (previousPinchSquaredDistance === 0 && previousMultiTouchPanPosition === null) {
            // First time this method is called for new pinch.
            // Next time this is called there will be a
            // previousPinchSquaredDistance and pinchSquaredDistance to compare.
            return;
        }
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            // Last time this method is called at the end of a pinch.
            return;
        }

        // Zoom and panning enabled together
        //if (this.multiTouchPanAndZoom) {
        this.__computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
        this._computeMultiTouchRotating(previousMultiTouchPanPosition, multiTouchPanPosition);

        // Zoom and panning enabled but only one at a time
        //}
    }

    private __computePinchZoom(previousPinchSquaredDistance: number, pinchSquaredDistance: number): void {
        const radius = this.camera.radius || ArcRotateCameraPointersInput.MinimumRadiusForPinch;
        if (this.useNaturalPinchZoom) {
            this.camera.radius = (radius * Math.sqrt(previousPinchSquaredDistance)) / Math.sqrt(pinchSquaredDistance);
        } else if (this.pinchDeltaPercentage) {
            this.camera.inertialRadiusOffset += (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 * radius * this.pinchDeltaPercentage;
        } else {
            this.camera.inertialRadiusOffset +=
                (pinchSquaredDistance - previousPinchSquaredDistance) /
                ((this.pinchPrecision * (this.pinchInwards ? 1 : -1) * (this.angularSensibilityX + this.angularSensibilityY)) / 2);
        }
    }

    private _computeMultiTouchRotating(previousMultiTouchPanPosition: Nullable<PointerTouch>, multiTouchPanPosition: Nullable<PointerTouch>): void {
        if (previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            this.camera.inertialAlphaOffset -= moveDeltaX / this.angularSensibilityX;
            this.camera.inertialBetaOffset -= moveDeltaY / this.angularSensibilityY;
        }
    }

}