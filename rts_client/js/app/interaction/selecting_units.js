var Interaction;
(function (Interaction) {
    var SelectingUnits;
    (function (SelectingUnits) {
        class CurrentAction {
            constructor(mx, my, cx, cy, sd) {
                this.clickX = mx;
                this.clickY = my;
                this.currentX = cx;
                this.currentY = cy;
            }
        }
        SelectingUnits.CurrentAction = CurrentAction;
        function selectedUnitIDs(game) {
            let selected = new Array();
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];
                if (soul && soul.current.is_selected) {
                    selected.push(i);
                }
            }
            return selected;
        }
        SelectingUnits.selectedUnitIDs = selectedUnitIDs;
        function selectUnits(game) {
            if (game.control instanceof Interaction.SelectingUnits.CurrentAction) {
                for (let i = 0; i < game.souls.length; i++) {
                    let soul = game.souls[i];
                    if (soul) {
                        if (soul.current.is_being_selected) {
                            soul.current.is_selected = true;
                        }
                        else if (!game.inputState.shiftDown()) {
                            soul.current.is_selected = false;
                        }
                    }
                }
            }
            configureCommandCard(game);
        }
        SelectingUnits.selectUnits = selectUnits;
        function configureCommandCard(game) {
            let cmdSet = {};
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];
                if (soul && soul.current.is_selected) {
                    for (let cmd of soul.current.command_roster) {
                        cmdSet[cmd] = null;
                    }
                }
            }
            let cmds = [];
            for (let cmd in cmdSet) {
                if (cmdSet.hasOwnProperty(cmd)) {
                    cmds.push(cmd);
                }
            }
            cmds.sort();
            game.commandPanel.renderCommands(cmds);
        }
        SelectingUnits.configureCommandCard = configureCommandCard;
        function configUnitSelections(game) {
            let control = game.control;
            if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                let x1 = control.clickX;
                let x2 = control.currentX;
                let y1 = control.clickY;
                let y2 = control.currentY;
                configureUnitsBeingSelected(game, x1, y1, x2, y2);
            }
            if (control instanceof Interaction.Core.DoingNothing) {
                let input = game.inputState;
                let width = game.unitDrawer.width();
                let height = game.unitDrawer.height();
                let scale = game.camera.scale;
                let x = game.camera.x + (input.mouseX() - width / 2) / scale;
                let y = game.camera.y - (input.mouseY() - height / 2) / scale;
                configureUnitsBeingSelected(game, x, y, x, y);
            }
        }
        SelectingUnits.configUnitSelections = configUnitSelections;
        function configureUnitsBeingSelected(game, x1, y1, x2, y2) {
            let minX = Math.min(x1, x2);
            let minY = Math.min(y1, y2);
            let maxX = Math.max(x1, x2);
            let maxY = Math.max(y1, y2);
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];
                if (soul && soul.new) {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let r = soul.current.collision_radius * Game.TILESIZE;
                    let rSqrd = r * r;
                    let nDif = y - maxY;
                    let sDif = y - minY;
                    let eDif = x - maxX;
                    let wDif = x - minX;
                    if (y >= minY && y <= maxY) {
                        if (x + r >= minX && x - r <= maxX) {
                            soul.current.is_being_selected = true;
                        }
                        else {
                            soul.current.is_being_selected = false;
                        }
                    }
                    else if (x >= minX && x <= maxX) {
                        if (y + r >= minY && y - r <= maxY) {
                            soul.current.is_being_selected = true;
                        }
                        else {
                            soul.current.is_being_selected = false;
                        }
                    }
                    else if (x > maxX) {
                        if (y > maxY && (nDif * nDif + eDif * eDif) <= rSqrd) {
                            soul.current.is_being_selected = true;
                        }
                        else if (y < minY && (sDif * sDif + eDif * eDif) <= rSqrd) {
                            soul.current.is_being_selected = true;
                        }
                        else {
                            soul.current.is_being_selected = false;
                        }
                    }
                    else if (x < minX) {
                        if (y > maxY && (nDif * nDif + wDif * wDif) <= rSqrd) {
                            soul.current.is_being_selected = true;
                        }
                        else if (y < minY && (sDif * sDif + wDif * wDif) <= rSqrd) {
                            soul.current.is_being_selected = true;
                        }
                        else {
                            soul.current.is_being_selected = false;
                        }
                    }
                    else {
                        soul.current.is_being_selected = false;
                    }
                }
            }
        }
        function begin(game) {
            let scale = game.camera.scale;
            let input = game.inputState;
            let width = game.unitDrawer.width();
            let height = game.unitDrawer.height();
            let x = game.camera.x + (input.mouseX() - width / 2) / scale;
            let y = game.camera.y - (input.mouseY() - height / 2) / scale;
            game.control = new Interaction.SelectingUnits.CurrentAction(x, y, x, y, game.inputState.shiftDown());
            if (!input.shiftDown()) {
                for (let i = 0; i < game.souls.length; i++) {
                    let soul = game.souls[i];
                    if (soul) {
                        soul.current.is_selected = false;
                    }
                }
            }
        }
        SelectingUnits.begin = begin;
    })(SelectingUnits = Interaction.SelectingUnits || (Interaction.SelectingUnits = {}));
})(Interaction || (Interaction = {}));
