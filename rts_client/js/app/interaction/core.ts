module Interaction.Core {

    export enum ServerMessage {
        Move,
        AttackMove,
        AttackTarget,
        Build,
        Train,
        Assist,
        Stop,
        MapInfoRequest,
        UnitInfoRequest,
        MissileInfoRequest,
    }

    export enum QueueOrder {
        Prepend,
        Append,
        Replace,
        Clear,
    }

    export interface Control { }

    export class DoingNothing implements Control { }

    function getTarget(game: Game): number {
        for (let i = 0; i < game.souls.length; i++) {
            let soul = game.souls[i];

            if (soul && soul.current.is_being_selected) {
                return i;
            }
        }
        return null;
    }

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
                    let targetID = getTarget(game);

                    if (targetID) {
                        if (game.souls[targetID].new.team === game.team) {
                            Interaction.AssistOrder.issue(game, targetID);
                        }
                        else {
                            Interaction.AttackTargetOrder.issue(game, targetID);
                        }
                    }
                    else {
                        Interaction.MoveOrder.issue(game);
                    }
                }
                else if (event === UserInput.InputEvent.KeyDown) {
                    const A = 65;
                    const B = 66;
                    const M = 77;
                    const S = 83;

                    if (state.lastKeyPressed() === A) {
                        game.control = new Interaction.AttackMoveOrder.BeingIssued();
                    }
                    else if (state.lastKeyPressed() === B) {
                        game.control = new Interaction.BuildSelection.BeingIssued();
                        Interaction.BuildSelection.configureCommandCard(game);
                    }
                    else if (state.lastKeyPressed() === M) {
                        game.control = new Interaction.MoveOrder.BeingIssued();
                    }
                    else if (state.lastKeyPressed() === S) {
                        Interaction.StopOrder.issue(game);
                    }
                }
                else if (event === UserInput.InputEvent.MouseWheel) {
                    game.camera.scale = Math.max(0.5, Math.min(2, game.camera.scale - 0.002 * game.inputState.wheelChange()));
                }
            }
            else if (control instanceof Interaction.MovingCamera) {
                if (event === UserInput.InputEvent.MouseMiddleUp) {
                    game.control = new DoingNothing();
                }
                else if (event === UserInput.InputEvent.MouseMove) {
                    game.camera.x = control.cameraX + (control.clickX - state.mouseX()) / game.camera.scale;
                    game.camera.y = control.cameraY - (control.clickY - state.mouseY()) / game.camera.scale;
                }
                else if (event === UserInput.InputEvent.MouseWheel) {
                    game.camera.scale = Math.max(1, Math.min(2, game.camera.scale - 0.002 * game.inputState.wheelChange()));
                }
            }
            else if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                if (event === UserInput.InputEvent.MouseLeftUp) {
                    Interaction.SelectingUnits.selectUnits(game);
                    game.control = new DoingNothing();
                }
                else if (event === UserInput.InputEvent.MouseMove) {
                    let scale = game.camera.scale;
                    let width = game.unitDrawer.width();
                    let height = game.unitDrawer.height();
                    control.currentX = game.camera.x + (state.mouseX() - width / 2) / scale;
                    control.currentY = game.camera.y - (state.mouseY() - height / 2) / scale;
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
                        Interaction.SelectingUnits.configureCommandCard(game);
                    }
                }
                else if (event === UserInput.InputEvent.MouseRightDown) {
                    game.control = new DoingNothing();
                    Interaction.SelectingUnits.configureCommandCard(game);
                }
            }
            else if (control instanceof Interaction.BuildSelection.BeingIssued) {
                if (event === UserInput.InputEvent.MouseLeftDown || event === UserInput.InputEvent.MouseRightDown) {
                    game.control = new DoingNothing();
                    Interaction.SelectingUnits.configureCommandCard(game);
                }
            }
        }
    }
}