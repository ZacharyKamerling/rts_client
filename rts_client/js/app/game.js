"use strict";
var Game = (function () {
    function Game() {
        this.connected = true;
        this.chef = null;
        this.inputState = null;
        this.tileDrawer = null;
        this.unitDrawer = null;
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
        this.team = 0;
        this.metal = 0;
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
        tc.name = "green";
        tc.red = 0.0;
        tc.green = 0.8;
        tc.blue = 0.0;
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
                    game.control = new Interaction.BuildOrder.BeingIssued(3, 3, 1, "building");
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
        this.drawBuildPlacement();
        this.drawUnitsAndMissiles();
        this.drawBuildPlacement();
        this.drawFogOfWar();
        this.drawStatusBars();
        this.drawSelectBox();
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
        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            var x = Math.floor((this.inputState.mouseX() - this.camera.x) / Game.TILESIZE) * Game.TILESIZE;
            var y = Math.floor((this.inputState.mouseY() - this.camera.y) / Game.TILESIZE) * Game.TILESIZE;
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
        // Render units
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && (soul.current.isSelected)) {
                var x = soul.current.x;
                var y = soul.current.y;
                var radius = soul.current.radius();
                var r = 0;
                var g = 255;
                var b = 100;
                var a = 255;
                selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
            }
            else if (soul && soul.current.isBeingSelected) {
                var x = soul.current.x;
                var y = soul.current.y;
                var radius = soul.current.radius();
                var r = 0;
                var g = 255;
                var b = 100;
                var a = 255;
                dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
            }
        }
        this.selectionDrawer.draw(false, this.camera.x, this.camera.y, selections);
        this.selectionDrawer.draw(true, this.camera.x, this.camera.y, dashed);
    };
    Game.prototype.drawStatusBars = function () {
        var bars = new Array();
        // Render units
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current) {
                var radius = soul.current.radius();
                var x = soul.current.x;
                var y = soul.current.y + radius * Game.TILESIZE;
                var w = soul.current.radius() * Game.TILESIZE;
                var h = 2;
                if (soul.current.progress <= 254) {
                    var v = soul.current.progress / 254;
                    var r = 175;
                    var g = 175;
                    var b = 175;
                    var a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.current.health <= 254) {
                    var v = soul.current.health / 254;
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
    Game.TILESIZE = 32;
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
//# sourceMappingURL=game.js.map