module Interaction.Core {

    export interface Control {}

    export class DoingNothing implements Control {}

    export function interact(game: Game): ((parent: HTMLElement, e: InputEvent) => void) {
        return function (parent, event) {
            let control = game.control;

            if (control instanceof DoingNothing) {
                if (event instanceof MousePress) {
                    // Move Camera initiate
                    if (event.btn === MouseButton.Middle && event.down) {
                        game.control = new MovingCamera(event.x, event.y, game.camera.x, game.camera.y);
                    }
                    // Select things initiate
                    else if (event.btn === MouseButton.Left && event.down) {
                        Interaction.SelectingUnits.begin(game, parent, event);
                    }
                    // Issue move order
                    else if (event.btn === MouseButton.Right && event.down) {
                        Interaction.MoveOrder.issue(game, parent, event);
                    }
                }
                else if (event instanceof KeyPress) {
                    const A = 65;
                    const M = 77;

                    if (event.down) {
                        if (event.key === A) {
                            game.control = new Interaction.AttackMoveOrder.BeingIssued();
                        }
                        else if (event.key === M) {
                            game.control = new Interaction.MoveOrder.BeingIssued();
                        }
                    }
                }
            }
            else if (control instanceof MovingCamera) {
                // Stop moving camera
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Middle && !event.down) {
                        game.control = new DoingNothing();
                    }
                }
                // Move camera
                else if (event instanceof MouseMove) {
                    game.camera.x = control.cameraX + control.clickX - event.x;
                    game.camera.y = control.cameraY - (control.clickY - event.y);
                }
            }
            else if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                // Select units
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && !event.down) {
                        Interaction.SelectingUnits.selectUnits(game);
                        game.control = new DoingNothing();
                    }
                }
                else if (event instanceof MouseMove) {
                    control.currentX = game.camera.x + event.x - parent.offsetWidth / 2;
                    control.currentY = game.camera.y - (event.y - parent.offsetHeight / 2);
                    control.shiftDown = event.shiftDown;
                }
            }
            else if (control instanceof Interaction.AttackMoveOrder.BeingIssued) {
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && event.down) {
                        Interaction.AttackMoveOrder.issue(game, parent, event);
                    }
                    game.control = new DoingNothing();
                }
            }
            else if (control instanceof Interaction.MoveOrder.BeingIssued) {
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && event.down) {
                        Interaction.MoveOrder.issue(game, parent, event);
                    }
                    else {
                        game.control = new DoingNothing();
                    }
                }
            }
            else if (control instanceof Interaction.BuildOrder.BeingIssued) {
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && event.down) {
                        Interaction.BuildOrder.issue(game, parent, event, control.type);

                        if (!event.shiftDown) {
                            game.control = new DoingNothing();
                        }
                    }
                    else if (event.btn === MouseButton.Right && event.down) {
                        game.control = new DoingNothing();
                    }
                    else if (event.btn === MouseButton.Middle && event.down) {

                    }
                }
            }
        };
    }
}