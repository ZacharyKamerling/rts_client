module Interaction.MinimapCore {

    export function interact(game: Game): ((state: UserInput.InputState, event: UserInput.InputEvent) => void) {
        return function (state, event) {
            let control = game.control;
            if (control instanceof Interaction.Core.DoingNothing) {
                if (event === UserInput.InputEvent.MouseLeftDown) {
                    //game.control = new MovingCamera(state.mouseX(), state.mouseY(), game.camera.x, game.camera.y);
                }
            }
        }
    }
}