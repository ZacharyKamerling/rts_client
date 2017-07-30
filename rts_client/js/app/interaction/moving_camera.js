var Interaction;
(function (Interaction) {
    var MovingCamera = (function () {
        function MovingCamera(mx, my, cx, cy) {
            this.clickX = mx;
            this.clickY = my;
            this.cameraX = cx;
            this.cameraY = cy;
        }
        return MovingCamera;
    }());
    Interaction.MovingCamera = MovingCamera;
})(Interaction || (Interaction = {}));
