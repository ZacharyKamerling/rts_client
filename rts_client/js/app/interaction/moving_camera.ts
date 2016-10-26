module Interaction {
    export class MovingCamera implements Interaction.Core.Control {
        clickX: number;
        clickY: number;
        cameraX: number;
        cameraY: number;

        constructor(mx: number, my: number, cx: number, cy: number) {
            this.clickX = mx;
            this.clickY = my;
            this.cameraX = cx;
            this.cameraY = cy;
        }
    }
}