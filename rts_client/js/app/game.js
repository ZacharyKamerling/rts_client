"use strict";
var Game = (function () {
    function Game() {
        this.chef = null;
        this.tileDrawer = null;
        this.unitDrawer = null;
        this.fowDrawer = null;
        this.selectionDrawer = null;
        this.control = new DoingNothing();
        this.camera = new Camera(0, 0);
        this.connection = null;
        this.souls = null;
        this.missile_souls = null;
        this.logicFrame = 0;
        this.team = 0;
        this.metal = 0;
        this.energy = 0;
        this.timeSinceLastLogicFrame = 0;
        this.souls = Array();
        for (var i = 0; i < Game.MAX_UNITS; i++) {
            this.souls.push(null);
        }
        this.missile_souls = Array();
        for (var i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missile_souls.push(null);
        }
    }
    Game.prototype.disconnected = function () {
        for (var i = 0; i < Game.MAX_UNITS; i++) {
            this.souls[i] = null;
        }
    };
    Game.prototype.setChef = function (chef) {
        this.chef = chef;
    };
    Game.prototype.setConnection = function (conn) {
        this.connection = conn;
    };
    Game.prototype.setTileDrawer = function (td) {
        this.tileDrawer = td;
    };
    Game.prototype.setUnitDrawer = function (ud) {
        this.unitDrawer = ud;
    };
    Game.prototype.setFOWDrawer = function (fd) {
        this.fowDrawer = fd;
    };
    Game.prototype.setSelectionDrawer = function (sd) {
        this.selectionDrawer = sd;
    };
    Game.prototype.processPacket = function (data) {
        var logicFrame = data.getU32();
        if (logicFrame >= this.logicFrame) {
            this.logicFrame = logicFrame;
            this.timeSinceLastLogicFrame = 0;
            for (var i = 0; i < this.souls.length; i++) {
                var soul = this.souls[i];
                if (soul && (logicFrame - soul.new.frame_created > 1)) {
                    this.souls[i] = null;
                }
            }
            for (var i = 0; i < this.missile_souls.length; i++) {
                var misl_soul = this.missile_souls[i];
                if (misl_soul && (logicFrame - misl_soul.new.frame_created > 1)) {
                    this.missile_souls[i] = null;
                }
            }
        }
        else {
            return;
        }
        while (!data.empty()) {
            var msg_type = data.getU8();
            msg_switch: switch (msg_type) {
                // Unit
                case 0:
                    var new_unit = Unit.decodeUnit(data, logicFrame);
                    // If unit_soul exists, update it with new_unit
                    if (new_unit) {
                        var soul = this.souls[new_unit.unit_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.new = new_unit;
                        }
                        else {
                            var cur = new_unit.clone();
                            this.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case 1:
                case 2:
                    var exploding = msg_type === 2;
                    var new_misl = Missile.decodeMissile(data, logicFrame, exploding);
                    if (new_misl) {
                        var soul = this.missile_souls[new_misl.misl_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.new = new_misl;
                        }
                        else {
                            var cur_1 = new_misl.clone();
                            this.missile_souls[new_misl.misl_ID] = { old: null, current: cur_1, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case 3:
                    var unit_ID = data.getU16();
                    var dmg_type = data.getU8();
                    this.souls[unit_ID] = null;
                    break msg_switch;
                // Player Info
                case 4:
                    this.team = data.getU8();
                    this.metal = data.getU32();
                    this.energy = data.getU32();
                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return;
            }
        }
    };
    Game.prototype.interact_canvas = function () {
        var game = this;
        return function (parent, event) {
            var control = game.control;
            if (control instanceof DoingNothing) {
                if (event instanceof MousePress) {
                    // Move Camera initiate
                    if (event.btn === MouseButton.Middle && event.down) {
                        game.control = new MovingCamera(event.x, event.y, game.camera.x, game.camera.y);
                    }
                    // Select things initiate
                    if (event.btn === MouseButton.Left && event.down) {
                        var x = game.camera.x + event.x - parent.offsetWidth / 2;
                        var y = game.camera.y - (event.y - parent.offsetHeight / 2);
                        game.control = new SelectingUnits(x, y, x, y);
                    }
                    // Issue move order
                    if (event.btn === MouseButton.Right && event.down) {
                        var selected = new Array();
                        for (var i = 0; i < game.souls.length; i++) {
                            var soul = game.souls[i];
                            if (soul && soul.current.is_selected) {
                                selected.push(i);
                            }
                        }
                        game.chef.put8(0);
                        if (event.shiftDown) {
                            game.chef.put8(1);
                        }
                        else {
                            game.chef.put8(0);
                        }
                        game.chef.put16(selected.length);
                        game.chef.putF64((game.camera.x + event.x - parent.offsetWidth / 2) / Game.TILESIZE);
                        game.chef.putF64((game.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);
                        for (var i = 0; i < selected.length; i++) {
                            game.chef.put16(selected[i]);
                        }
                        game.connection.send(game.chef.done());
                    }
                }
                else if (event instanceof KeyPress) {
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
                        var minX = Math.min(control.clickX, control.currentX);
                        var minY = Math.min(control.clickY, control.currentY);
                        var maxX = Math.max(control.clickX, control.currentX);
                        var maxY = Math.max(control.clickY, control.currentY);
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
                                        soul.current.is_selected = true;
                                    }
                                    else if (!event.shiftDown) {
                                        soul.current.is_selected = false;
                                    }
                                }
                                else if (x >= minX && x <= maxX) {
                                    if (y + r >= minY && y - r <= maxY) {
                                        soul.current.is_selected = true;
                                    }
                                    else if (!event.shiftDown) {
                                        soul.current.is_selected = false;
                                    }
                                }
                                else if (x > maxX) {
                                    // Northeast
                                    if (y > maxY && (nDif * nDif + eDif * eDif) <= rSqrd) {
                                        soul.current.is_selected = true;
                                    }
                                    else if (y < minY && (sDif * sDif + eDif * eDif) <= rSqrd) {
                                        soul.current.is_selected = true;
                                    }
                                    else if (!event.shiftDown) {
                                        soul.current.is_selected = false;
                                    }
                                }
                                else if (x < minX) {
                                    // Northwest
                                    if (y > maxY && (nDif * nDif + wDif * wDif) <= rSqrd) {
                                        soul.current.is_selected = true;
                                    }
                                    else if (y < minY && (sDif * sDif + wDif * wDif) <= rSqrd) {
                                        soul.current.is_selected = true;
                                    }
                                    else if (!event.shiftDown) {
                                        soul.current.is_selected = false;
                                    }
                                }
                                else if (!event.shiftDown) {
                                    soul.current.is_selected = false;
                                }
                            }
                            var minBoxX = minX - game.camera.x;
                            var minBoxY = minY - game.camera.y;
                            var maxBoxX = maxX - game.camera.x;
                            var maxBoxY = maxY - game.camera.y;
                            game.drawSelectionBox(minBoxX, minBoxY, maxBoxX, maxBoxY);
                        }
                        game.control = new DoingNothing();
                    }
                }
                else if (event instanceof MouseMove) {
                    control.currentX = game.camera.x + event.x - parent.offsetWidth / 2;
                    control.currentY = game.camera.y - (event.y - parent.offsetHeight / 2);
                }
            }
        };
    };
    Game.prototype.drawSelectionBox = function (minX, minY, maxX, maxY) {
        //let ctx = this.fowDrawer.
    };
    Game.prototype.draw = function (time_passed) {
        this.timeSinceLastLogicFrame += time_passed;
        this.stepUnits(time_passed);
        this.stepMissiles(time_passed);
        this.tileDrawer.draw(this.camera.x, this.camera.y, 1);
        this.drawSelections();
        this.drawUnitsAndMissiles();
        this.drawFogOfWar();
    };
    Game.prototype.stepUnits = function (time) {
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.new && soul.old) {
                soul.current.step(time, soul.old, soul.new);
            }
        }
    };
    Game.prototype.stepMissiles = function (time) {
        for (var i = 0; i < this.missile_souls.length; i++) {
            var soul = this.missile_souls[i];
            if (soul && soul.old) {
                soul.current.step(time, soul.old, soul.new);
            }
        }
    };
    Game.prototype.drawUnitsAndMissiles = function () {
        var layers = new Array(10);
        for (var i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        // Render units
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                soul.current.render(this, layers);
            }
        }
        // Render missiles
        for (var i = 0; i < this.missile_souls.length; i++) {
            var soul = this.missile_souls[i];
            if (soul) {
                if (soul.current.exploding) {
                    soul.current.renderExplosion(this, layers);
                    this.missile_souls[i] = null;
                }
                else {
                    soul.current.render(this, layers);
                }
            }
        }
        var flattened = new Array();
        for (var i = 0; i < layers.length; i++) {
            for (var n = 0; n < layers[i].length; n++) {
                flattened.push(layers[i][n]);
            }
        }
        this.unitDrawer.draw(this.camera.x, this.camera.y, 1, flattened);
    };
    Game.prototype.drawSelections = function () {
        var selections = new Array();
        // Render units
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current.is_selected) {
                selections.push({ x: soul.current.x, y: soul.current.y, r: soul.current.getRadius() });
            }
        }
        this.selectionDrawer.draw(this.camera.x, this.camera.y, 1, selections);
    };
    Game.prototype.drawFogOfWar = function () {
        var circles = new Array();
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.getSightRadius() });
                }
            }
        }
        this.fowDrawer.draw(this.camera.x, this.camera.y, 1, circles);
    };
    Game.TILESIZE = 32;
    Game.MAX_UNITS = 4096;
    return Game;
})();
var DoingNothing = (function () {
    function DoingNothing() {
    }
    return DoingNothing;
})();
var SelectingUnits = (function () {
    function SelectingUnits(mx, my, cx, cy) {
        this.clickX = mx;
        this.clickY = my;
        this.currentX = cx;
        this.currentY = cy;
    }
    return SelectingUnits;
})();
var MovingCamera = (function () {
    function MovingCamera(mx, my, cx, cy) {
        this.clickX = mx;
        this.clickY = my;
        this.cameraX = cx;
        this.cameraY = cy;
    }
    return MovingCamera;
})();
var Camera = (function () {
    function Camera(x, y) {
        this.x = x;
        this.y = y;
    }
    return Camera;
})();
//# sourceMappingURL=game.js.map