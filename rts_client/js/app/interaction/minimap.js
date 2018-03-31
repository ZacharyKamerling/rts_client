var Interaction;
(function (Interaction) {
    var Minimap;
    (function (Minimap) {
        class MovingCamera {
        }
        Minimap.MovingCamera = MovingCamera;
        function interact(game) {
            return function (state, event) {
                let control = game.control;
                let minimapCanvas = document.getElementById('minimapCanvas');
                let bw = minimapCanvas.offsetWidth;
                let bh = minimapCanvas.offsetHeight;
                let w = minimapCanvas.clientWidth;
                let h = minimapCanvas.clientHeight;
                let wDif = (bw - w) / 2;
                let hDif = (bh - h) / 2;
                let mapW = game.mapWidth * Game.TILESIZE;
                let mapH = game.mapHeight * Game.TILESIZE;
                let x = Math.min(1, Math.max(0, (state.mouseX() - wDif) / w)) * mapW;
                let y = Math.min(1, Math.max(0, (1 - (state.mouseY() - hDif) / h))) * mapH;
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
                        let w = game.mapWidth * Game.TILESIZE;
                        let h = game.mapHeight * Game.TILESIZE;
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
