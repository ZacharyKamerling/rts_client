module Interaction.Core {

    export enum ServerMessage {
        Move,
        AttackMove,
        AttackTarget,
        Build,
        MapInfoRequest,
    }

    export enum QueueOrder {
        Prepend,
        Append,
        Replace,
    }

    export interface Control { }

    export class DoingNothing implements Control { }

    export function interact(game: Game): ((state: UserInput.InputState, event: UserInput.InputEvent) => void) {
        return function (state, event) {
            let control = game.control;
            if (control instanceof Interaction.Core.DoingNothing) {
                if (event === UserInput.InputEvent.MouseLeftDown) {
                    Interaction.SelectingUnits.begin(game);
                }
                else if (event === UserInput.InputEvent.MouseMiddleDown) {
                    game.control = new MovingCamera(state.mouseX(), state.mouseY(), game.camera.x, game.camera.y);
                }
                else if (event === UserInput.InputEvent.MouseRightDown) {
                    Interaction.MoveOrder.issue(game);
                }
                else if (event === UserInput.InputEvent.KeyDown) {
                    const A = 65;
                    const M = 77;

                    if (state.lastKeyPressed() === A) {
                        game.control = new Interaction.AttackMoveOrder.BeingIssued();
                    }
                    else if (state.lastKeyPressed() === M) {
                        game.control = new Interaction.MoveOrder.BeingIssued();
                    }
                }
            }
            else if (control instanceof Interaction.MovingCamera) {
                if (event === UserInput.InputEvent.MouseMiddleUp) {
                    game.control = new DoingNothing();
                }
                else if (event === UserInput.InputEvent.MouseMove) {
                    game.camera.x = control.cameraX + control.clickX - state.mouseX();
                    game.camera.y = control.cameraY - (control.clickY - state.mouseY());
                }
            }
            else if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                if (event === UserInput.InputEvent.MouseLeftUp) {
                    Interaction.SelectingUnits.selectUnits(game);
                    game.control = new DoingNothing();
                }
                else if (event === UserInput.InputEvent.MouseMove) {
                    let elem = state.element();
                    control.currentX = game.camera.x + state.mouseX() - elem.offsetWidth / 2;
                    control.currentY = game.camera.y - (state.mouseY() - elem.offsetHeight / 2);
                }
            }
            else if (control instanceof Interaction.AttackMoveOrder.BeingIssued) {
                if (event === UserInput.InputEvent.MouseLeftDown) {
                    Interaction.AttackMoveOrder.issue(game);

                    if (!state.shiftDown()) {
                        game.control = new DoingNothing();
                    }
                }
                else if (event === UserInput.InputEvent.MouseRightDown) {
                    game.control = new DoingNothing();
                }
            }
            else if (control instanceof Interaction.MoveOrder.BeingIssued) {
                if (event === UserInput.InputEvent.MouseLeftDown) {
                    Interaction.MoveOrder.issue(game);

                    if (!state.shiftDown()) {
                        game.control = new DoingNothing();
                    }
                }
                else if (event === UserInput.InputEvent.MouseRightDown) {
                    game.control = new DoingNothing();
                }
            }
            else if (control instanceof Interaction.BuildOrder.BeingIssued) {
                if (event === UserInput.InputEvent.MouseLeftDown) {
                    Interaction.BuildOrder.issue(game, control.type);

                    if (!state.shiftDown()) {
                        game.control = new DoingNothing();
                    }
                }
                else if (event === UserInput.InputEvent.MouseRightDown) {
                    game.control = new DoingNothing();
                }
            }
        }
    }
}