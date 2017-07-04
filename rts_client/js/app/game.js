"use strict";
var Game = (function () {
    function Game() {
        this.connected = true;
        this.chef = null;
        this.inputState = null;
        this.tileDrawer = null;
        this.unitDrawer = null;
        this.minimapDrawer = null;
        this.minimapBoxDrawer = null;
        this.fowDrawer = null;
        this.commandPanel = null;
        this.selectionDrawer = null;
        this.selectionBoxDrawer = null;
        this.statusBarDrawer = null;
        this.buildPlacementDrawer = null;
        this.control = new Interaction.Core.DoingNothing();
        this.camera = new Camera(0, 0);
        this.connection = null;
        this.souls = null;
        this.missileSouls = null;
        this.logicFrame = 0;
        this.lastDrawTime = 0;
        this.lastLogicFrameTime = 0;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.team = 0;
        this.prime = 0;
        this.energy = 0;
        this.orderID = 0;
        this.souls = Array();
        for (var i = 0; i < Game.MAX_UNITS; i++) {
            this.souls.push(null);
        }
        this.missileSouls = Array();
        for (var i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls.push(null);
        }
        this.teamColors = Array();
        var tc = new TeamColor();
        tc.name = "green";
        tc.red = 0.0;
        tc.green = 0.9;
        tc.blue = 0.0;
        this.teamColors.push(tc.clone());
        tc.name = "white";
        tc.red = 1.0;
        tc.green = 1.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "aqua";
        tc.red = 0.0;
        tc.green = 1.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "purple";
        tc.red = 0.8;
        tc.green = 0.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
    }
    Game.prototype.reset = function () {
        for (var i = 0; i < Game.MAX_UNITS; i++) {
            this.souls[i] = null;
        }
        for (var i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls[i] = null;
        }
    };
    Game.prototype.commandPanelHandler = function () {
        var game = this;
        return function (name) {
            switch (name) {
                case "move":
                    game.control = new Interaction.MoveOrder.BeingIssued();
                    break;
                case "attack":
                    game.control = new Interaction.AttackMoveOrder.BeingIssued();
                    break;
                case "build":
                    game.control = new Interaction.BuildOrder.BeingIssued(3, 3, UnitType.TestStructure, "building");
                    break;
                default:
                    console.log('commandPanelHandler couldn\'t handle: ' + name);
                    game.control = new Interaction.Core.DoingNothing();
                    break;
            }
        };
    };
    Game.prototype.draw = function () {
        var currentTime = Date.now();
        var timeDelta = (currentTime - this.lastDrawTime) * Game.FPS / 1000;
        Interaction.SelectingUnits.configUnitSelections(this);
        this.stepUnits(timeDelta);
        this.stepMissiles(timeDelta);
        this.tileDrawer.draw(this.camera.x, this.camera.y, 1);
        this.drawSelections();
        this.drawUnitsAndMissiles();
        this.drawBuildPlacement();
        this.drawFogOfWar();
        this.drawStatusBars();
        this.drawSelectBox();
        this.drawMinimap();
        this.lastDrawTime = currentTime;
    };
    Game.prototype.stepUnits = function (timeDelta) {
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.new && soul.old) {
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    };
    Game.prototype.stepMissiles = function (timeDelta) {
        for (var i = 0; i < this.missileSouls.length; i++) {
            var soul = this.missileSouls[i];
            if (soul && soul.current && soul.old && soul.new) {
                soul.current.step(Game.FPS, timeDelta, soul.old, soul.new);
            }
        }
    };
    Game.prototype.drawSelectBox = function () {
        var control = this.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            var minX = Math.min(control.clickX, control.currentX);
            var minY = Math.min(control.clickY, control.currentY);
            var maxX = Math.max(control.clickX, control.currentX);
            var maxY = Math.max(control.clickY, control.currentY);
            var minBoxX = minX - this.camera.x;
            var minBoxY = minY - this.camera.y;
            var maxBoxX = maxX - this.camera.x;
            var maxBoxY = maxY - this.camera.y;
            this.selectionBoxDrawer.draw(minBoxX, minBoxY, maxBoxX, maxBoxY);
        }
    };
    Game.prototype.drawBuildPlacement = function () {
        var control = this.control;
        var input = this.inputState;
        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            var layers = new Array();
            var norm_x = (this.camera.x + (input.mouseX() - this.unitDrawer.width() / 2)) / Game.TILESIZE;
            var norm_y = (this.camera.y - (input.mouseY() - this.unitDrawer.height() / 2)) / Game.TILESIZE;
            var half_w = 4.0 / 2.0;
            var half_h = 4.0 / 2.0;
            var x = (Math.floor(norm_x - half_w + 0.00001) + half_w) * Game.TILESIZE;
            var y = (Math.floor(norm_y - half_h + 0.00001) + half_h) * Game.TILESIZE;
            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_platform1" + this.teamColors[this.team].name
            });
            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_wpn2" + this.teamColors[this.team].name
            });
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, 1, layers);
        }
    };
    Game.prototype.drawMinimap = function () {
        var layers = new Array(10);
        for (var i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                soul.current.renderMinimap(this, layers);
            }
        }
        var flattened = new Array();
        for (var i = 0; i < layers.length; i++) {
            for (var n = 0; n < layers[i].length; n++) {
                var tmp = layers[i][n];
                tmp.x = tmp.x / Game.TILESIZE / this.mapWidth;
                tmp.y = tmp.y / Game.TILESIZE / this.mapHeight;
                flattened.push(tmp);
            }
        }
        var mapW = this.mapWidth * Game.TILESIZE;
        var mapH = this.mapHeight * Game.TILESIZE;
        var drawCanvas = document.getElementById('drawCanvas');
        var w = drawCanvas.clientWidth;
        var h = drawCanvas.clientHeight;
        var hw = w / 2;
        var hh = h / 2;
        var cx = this.camera.x;
        var cy = this.camera.y;
        var x1 = (cx - hw) / mapW * 2 - 1;
        var y1 = (cy - hh) / mapH * 2 - 1;
        var x2 = (cx + hw) / mapW * 2 - 1;
        var y2 = (cy + hh) / mapH * 2 - 1;
        this.minimapDrawer.draw(flattened);
        this.minimapBoxDrawer.draw(x1, y1, x2, y2);
    };
    Game.prototype.drawUnitsAndMissiles = function () {
        var layers = new Array(10);
        for (var i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                soul.current.render(this, layers);
            }
        }
        for (var i = 0; i < this.missileSouls.length; i++) {
            var soul = this.missileSouls[i];
            if (soul) {
                if (soul.current.exploding) {
                    soul.current.renderExplosion(this, layers);
                    this.missileSouls[i] = null;
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
        var dashed = new Array();
        var enemy_selections = new Array();
        var enemy_dashed = new Array();
        var onlyEnemyIsBeingSelected = true;
        var onlyEnemyIsSelected = true;
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                if (soul.current.team === this.team) {
                    var x = soul.current.x;
                    var y = soul.current.y;
                    var radius = soul.current.radius();
                    var r = 0;
                    var g = 255;
                    var b = 100;
                    var a = 255;
                    if (soul.current.isSelected) {
                        onlyEnemyIsSelected = false;
                        selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.isBeingSelected) {
                        onlyEnemyIsBeingSelected = false;
                        dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
                else {
                    var x = soul.current.x;
                    var y = soul.current.y;
                    var radius = soul.current.radius();
                    var r = 255;
                    var g = 0;
                    var b = 100;
                    var a = 255;
                    if (soul.current.isSelected && onlyEnemyIsSelected) {
                        enemy_selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.isBeingSelected && onlyEnemyIsBeingSelected) {
                        enemy_dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
            }
        }
        if (onlyEnemyIsSelected) {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, enemy_selections);
        }
        else {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, selections);
        }
        if (onlyEnemyIsBeingSelected) {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, enemy_dashed);
        }
        else {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, dashed);
        }
    };
    Game.prototype.drawStatusBars = function () {
        var bars = new Array();
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current) {
                var radius = soul.current.radius();
                var x = soul.current.x;
                var y = soul.current.y + radius * Game.TILESIZE;
                var w = soul.current.radius() * Game.TILESIZE;
                var h = 2;
                if (soul.current.progress < 254.99) {
                    var v = soul.current.progress / 255;
                    var r = 175;
                    var g = 175;
                    var b = 175;
                    var a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.current.health < 254.99) {
                    var v = soul.current.health / 255;
                    var r = (255 - soul.current.health);
                    var g = (255 - soul.current.health);
                    var b = soul.current.health;
                    var a = 255;
                    bars.push({ x: x, y: y, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
            }
        }
        this.statusBarDrawer.draw(this.camera.x, this.camera.y, 1, bars);
    };
    Game.prototype.drawFogOfWar = function () {
        var circles = new Array();
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.sightRadius() });
                }
            }
        }
        this.fowDrawer.draw(this.camera.x, this.camera.y, 1, circles);
    };
    Game.MAX_UNITS = 4096;
    Game.TILESIZE = 20;
    Game.FPS = 10;
    return Game;
}());
var Camera = (function () {
    function Camera(x, y) {
        this.x = x;
        this.y = y;
    }
    return Camera;
}());
