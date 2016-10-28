var Interaction;
(function (Interaction) {
    var SelectingUnits;
    (function (SelectingUnits) {
        var CurrentAction = (function () {
            function CurrentAction(mx, my, cx, cy, sd) {
                this.clickX = mx;
                this.clickY = my;
                this.currentX = cx;
                this.currentY = cy;
                this.shiftDown = sd;
            }
            return CurrentAction;
        }());
        SelectingUnits.CurrentAction = CurrentAction;
        function selectedUnitIDs(game) {
            var selected = new Array();
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && soul.current.isSelected) {
                    selected.push(i);
                }
            }
            return selected;
        }
        SelectingUnits.selectedUnitIDs = selectedUnitIDs;
        function selectUnits(game) {
            var control = game.control;
            if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                for (var i = 0; i < game.souls.length; i++) {
                    var soul = game.souls[i];
                    if (soul) {
                        if (soul.current.team === game.team && soul.current.isBeingSelected) {
                            soul.current.isSelected = true;
                        }
                        else if (!control.shiftDown) {
                            soul.current.isSelected = false;
                        }
                    }
                }
            }
            // Configure command card
            var cmdSet = {};
            var bldSet = {};
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && soul.current.isSelected) {
                    soul.current.buildables(bldSet);
                    soul.current.commands(cmdSet);
                }
            }
            var cmds = [];
            for (var cmd in cmdSet) {
                if (cmdSet.hasOwnProperty(cmd)) {
                    cmds.push(cmd);
                }
            }
            var blds = [];
            for (var bld in bldSet) {
                if (bldSet.hasOwnProperty(bld)) {
                    blds.push(bld);
                }
            }
            cmds.sort();
            blds.sort();
            game.commandPanel.renderCommands(cmds.concat(blds));
        }
        SelectingUnits.selectUnits = selectUnits;
        function configUnitSelections(game) {
            var control = game.control;
            if (control instanceof Interaction.SelectingUnits.CurrentAction) {
                configureUnitsBeingSelected(game, control.clickX, control.clickY, control.currentX, control.currentY);
            }
            if (control instanceof Interaction.Core.DoingNothing) {
            }
        }
        SelectingUnits.configUnitSelections = configUnitSelections;
        function configureUnitsBeingSelected(game, x1, y1, x2, y2) {
            var minX = Math.min(x1, x2);
            var minY = Math.min(y1, y2);
            var maxX = Math.max(x1, x2);
            var maxY = Math.max(y1, y2);
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && soul.new && soul.new.team === game.team) {
                    var x = soul.current.x;
                    var y = soul.current.y;
                    var r = soul.current.getRadius() * Game.TILESIZE;
                    var rSqrd = r * r;
                    var nDif = y - maxY;
                    var sDif = y - minY;
                    var eDif = x - maxX;
                    var wDif = x - minX;
                    if (y >= minY && y <= maxY) {
                        if (x + r >= minX && x - r <= maxX) {
                            soul.current.isBeingSelected = true;
                        }
                        else {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x >= minX && x <= maxX) {
                        if (y + r >= minY && y - r <= maxY) {
                            soul.current.isBeingSelected = true;
                        }
                        else {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x > maxX) {
                        // Northeast
                        if (y > maxY && (nDif * nDif + eDif * eDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (y < minY && (sDif * sDif + eDif * eDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x < minX) {
                        // Northwest
                        if (y > maxY && (nDif * nDif + wDif * wDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (y < minY && (sDif * sDif + wDif * wDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else {
                        soul.current.isBeingSelected = false;
                    }
                }
            }
        }
        function begin(game, parent, event) {
            var x = game.camera.x + event.x - parent.offsetWidth / 2;
            var y = game.camera.y - (event.y - parent.offsetHeight / 2);
            game.control = new Interaction.SelectingUnits.CurrentAction(x, y, x, y, event.shiftDown);
            if (!event.shiftDown) {
                for (var i = 0; i < game.souls.length; i++) {
                    var soul = game.souls[i];
                    if (soul) {
                        soul.current.isSelected = false;
                    }
                }
            }
        }
        SelectingUnits.begin = begin;
    })(SelectingUnits = Interaction.SelectingUnits || (Interaction.SelectingUnits = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=selecting_units.js.map