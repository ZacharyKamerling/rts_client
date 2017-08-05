var Interaction;
(function (Interaction) {
    var Core;
    (function (Core) {
        (function (ServerMessage) {
            ServerMessage[ServerMessage["Move"] = 0] = "Move";
            ServerMessage[ServerMessage["AttackMove"] = 1] = "AttackMove";
            ServerMessage[ServerMessage["AttackTarget"] = 2] = "AttackTarget";
            ServerMessage[ServerMessage["Build"] = 3] = "Build";
            ServerMessage[ServerMessage["Assist"] = 4] = "Assist";
            ServerMessage[ServerMessage["MapInfoRequest"] = 5] = "MapInfoRequest";
        })(Core.ServerMessage || (Core.ServerMessage = {}));
        var ServerMessage = Core.ServerMessage;
        (function (QueueOrder) {
            QueueOrder[QueueOrder["Prepend"] = 0] = "Prepend";
            QueueOrder[QueueOrder["Append"] = 1] = "Append";
            QueueOrder[QueueOrder["Replace"] = 2] = "Replace";
        })(Core.QueueOrder || (Core.QueueOrder = {}));
        var QueueOrder = Core.QueueOrder;
        var DoingNothing = (function () {
            function DoingNothing() {
            }
            return DoingNothing;
        }());
        Core.DoingNothing = DoingNothing;
        function getTarget(game) {
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && soul.current.isBeingSelected) {
                    return soul.current;
                }
            }
        }
        function interact(game) {
            return function (state, event) {
                var control = game.control;
                if (control instanceof Interaction.Core.DoingNothing) {
                    if (event === UserInput.InputEvent.MouseLeftDown) {
                        Interaction.SelectingUnits.begin(game);
                    }
                    else if (event === UserInput.InputEvent.MouseMiddleDown) {
                        game.control = new Interaction.MovingCamera(state.mouseX(), state.mouseY(), game.camera.x, game.camera.y);
                    }
                    else if (event === UserInput.InputEvent.MouseRightDown) {
                        var target = getTarget(game);
                        if (target) {
                            if (target.team === game.team) {
                                Interaction.AssistOrder.issue(game, target.unit_ID);
                            }
                            else {
                                Interaction.AttackTargetOrder.issue(game, target.unit_ID);
                            }
                        }
                        else {
                            Interaction.MoveOrder.issue(game);
                        }
                    }
                    else if (event === UserInput.InputEvent.KeyDown) {
                        var A = 65;
                        var M = 77;
                        if (state.lastKeyPressed() === A) {
                            game.control = new Interaction.AttackMoveOrder.BeingIssued();
                        }
                        else if (state.lastKeyPressed() === M) {
                            game.control = new Interaction.MoveOrder.BeingIssued();
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
                        var scale = game.camera.scale;
                        var width = game.unitDrawer.width();
                        var height = game.unitDrawer.height();
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
                        }
                    }
                    else if (event === UserInput.InputEvent.MouseRightDown) {
                        game.control = new DoingNothing();
                    }
                }
            };
        }
        Core.interact = interact;
    })(Core = Interaction.Core || (Interaction.Core = {}));
})(Interaction || (Interaction = {}));
