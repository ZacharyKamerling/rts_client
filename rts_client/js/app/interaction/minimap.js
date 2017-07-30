var Interaction;
(function (Interaction) {
    var Minimap;
    (function (Minimap) {
        var MovingCamera = (function () {
            function MovingCamera() {
            }
            return MovingCamera;
        }());
        Minimap.MovingCamera = MovingCamera;
        function interact(game) {
            return function (state, event) {
                var control = game.control;
                var minimapCanvas = document.getElementById('minimapCanvas');
                var bw = minimapCanvas.offsetWidth;
                var bh = minimapCanvas.offsetHeight;
                var w = minimapCanvas.clientWidth;
                var h = minimapCanvas.clientHeight;
                var wDif = (bw - w) / 2;
                var hDif = (bh - h) / 2;
                var mapW = game.mapWidth * Game.TILESIZE;
                var mapH = game.mapHeight * Game.TILESIZE;
                var x = Math.min(1, Math.max(0, (state.mouseX() - wDif) / w)) * mapW;
                var y = Math.min(1, Math.max(0, (1 - (state.mouseY() - hDif) / h))) * mapH;
                if (control instanceof Interaction.Core.DoingNothing) {
                    if (event === UserInput.InputEvent.MouseLeftDown) {
                        game.control = new Minimap.MovingCamera();
                        game.camera.x = x;
                        game.camera.y = y;
                    }
                }
                else if (control instanceof Minimap.MovingCamera) {
                    if (event === UserInput.InputEvent.MouseMove) {
                        game.control = new Minimap.MovingCamera();
                        var w_1 = game.mapWidth * Game.TILESIZE;
                        var h_1 = game.mapHeight * Game.TILESIZE;
                        game.camera.x = x;
                        game.camera.y = y;
                    }
                    else {
                        game.control = new Interaction.Core.DoingNothing();
                    }
                }
            };
        }
        Minimap.interact = interact;
    })(Minimap = Interaction.Minimap || (Interaction.Minimap = {}));
})(Interaction || (Interaction = {}));
