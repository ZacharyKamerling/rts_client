interact();
(function (parent, e) { return void ; });
{
    var game = this;
    return function (parent, event) {
        var control = game.control;
        if (control instanceof DoingNothing) {
            if (event instanceof MousePress) {
                // Move Camera initiate
                if (event.btn === MouseButton.Middle && event.down) {
                    game.control = new MovingCamera(event.x, event.y, game.camera.x, game.camera.y);
                }
                else if (event.btn === MouseButton.Left && event.down) {
                    var x = game.camera.x + event.x - parent.offsetWidth / 2;
                    var y = game.camera.y - (event.y - parent.offsetHeight / 2);
                    game.control = new SelectingUnits(x, y, x, y, event.shiftDown);
                    if (!event.shiftDown) {
                        for (var i = 0; i < game.souls.length; i++) {
                            var soul = game.souls[i];
                            if (soul) {
                                soul.current.isSelected = false;
                            }
                        }
                    }
                }
                else if (event.btn === MouseButton.Right && event.down) {
                    game.issueMoveOrder(parent, event);
                }
            }
            else if (event instanceof KeyPress) {
                var A = 65;
                var M = 77;
                if (event.down) {
                    if (event.key === A) {
                        game.control = new IssuingAttackMove();
                    }
                    else if (event.key === M) {
                        game.control = new IssuingMove();
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
            else if (event instanceof MouseMove) {
                game.camera.x = control.cameraX + control.clickX - event.x;
                game.camera.y = control.cameraY - (control.clickY - event.y);
            }
        }
        else if (control instanceof SelectingUnits) {
            // Select units
            if (event instanceof MousePress) {
                if (event.btn === MouseButton.Left && !event.down) {
                    game.selectUnits();
                    game.control = new DoingNothing();
                }
            }
            else if (event instanceof MouseMove) {
                control.currentX = game.camera.x + event.x - parent.offsetWidth / 2;
                control.currentY = game.camera.y - (event.y - parent.offsetHeight / 2);
                control.shiftDown = event.shiftDown;
            }
        }
        else if (control instanceof IssuingAttackMove) {
            if (event instanceof MousePress) {
                if (event.btn === MouseButton.Left && event.down) {
                    game.issueAttackMoveOrder(parent, event);
                }
                game.control = new DoingNothing();
            }
        }
        else if (control instanceof IssuingMove) {
            if (event instanceof MousePress) {
                if (event.btn === MouseButton.Left && event.down) {
                    game.issueMoveOrder(parent, event);
                }
                else {
                    game.control = new DoingNothing();
                }
            }
        }
        else if (control instanceof IssuingBuild) {
            if (event instanceof MousePress) {
                if (event.btn === MouseButton.Left && event.down) {
                    game.issueBuildOrder(parent, event, control.type);
                }
                game.control = new DoingNothing();
            }
        }
    };
}
//# sourceMappingURL=controller.js.map