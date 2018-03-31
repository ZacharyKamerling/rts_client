var Interaction;
(function (Interaction) {
    class MovingCamera {
        constructor(mx, my, cx, cy) {
            this.clickX = mx;
            this.clickY = my;
            this.cameraX = cx;
            this.cameraY = cy;
        }
    }
    Interaction.MovingCamera = MovingCamera;
})(Interaction || (Interaction = {}));
