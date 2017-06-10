var Interaction;
(function (Interaction) {
    var MinimapCore;
    (function (MinimapCore) {
        function interact(game) {
            return function (state, event) {
                var control = game.control;
                if (control instanceof Interaction.Core.DoingNothing) {
                    if (event === UserInput.InputEvent.MouseLeftDown) {
                        game.control = new Interaction.MovingCamera(state.mouseX(), state.mouseY(), game.camera.x, game.camera.y);
                    }
                }
            };
        }
        MinimapCore.interact = interact;
    })(MinimapCore = Interaction.MinimapCore || (Interaction.MinimapCore = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=minimap_core.js.map