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
        this.camera = new Camera(0, 0, 1);
        this.connection = null;
        this.souls = null;
        this.missileSouls = null;
        this.logicFrame = 0;
        this.lastDrawTime = 0;
        this.lastLogicFrameTime = 0;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.team = 0;
        this.maxPrime = 0;
        this.maxEnergy = 0;
        this.prime = 0;
        this.energy = 0;
        this.primeOutput = 0;
        this.primeDrain = 0;
        this.energyOutput = 0;
        this.energyDrain = 0;
        this.orderID = 0;
        this.primeNodes = new Array();
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
        tc.name = "white";
        tc.red = 1.0;
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
        tc.green = 0.9;
        tc.blue = 0.0;
        this.teamColors.push(tc.clone());
        tc.name = "aqua";
        tc.red = 0.0;
        tc.green = 1.0;
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
                case "buildArtillery1":
                    game.control = new Interaction.BuildOrder.BeingIssued(3, 3, UnitType.Artillery1, Artillery1.renderBuildPlacement());
                    break;
                case "buildExtractor1":
                    game.control = new Interaction.BuildOrder.BeingIssued(3, 3, UnitType.Extractor1, Extractor1.renderBuildPlacement());
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
        this.tileDrawer.draw(this.camera.x, this.camera.y, this.camera.scale);
        this.drawPrimeNodes();
        this.drawSelections();
        this.drawUnitsAndMissiles();
        this.drawBuildPlacement();
        this.drawFogOfWar();
        this.drawStatusBars();
        this.drawSelectBox();
        this.drawMinimap();
        this.lastDrawTime = currentTime;
        var primeBar = document.getElementById('primeBar');
        var primeOutput = document.getElementById('primeOutput');
        var primeDrain = document.getElementById('primeDrain');
        var primeMaximum = document.getElementById('primeMaximum');
        var primeAmount = document.getElementById('primeAmount');
        primeBar.style.width = Math.max(0.5, this.prime / this.maxPrime * 256) + "px";
        primeOutput.textContent = "+" + this.primeOutput.toFixed(1);
        primeDrain.textContent = "-" + this.primeDrain.toFixed(1);
        primeAmount.textContent = this.prime.toString();
        primeMaximum.textContent = this.maxPrime.toString();
        var energyBar = document.getElementById('energyBar');
        var energyOutput = document.getElementById('energyOutput');
        var energyDrain = document.getElementById('energyDrain');
        var energyMaximum = document.getElementById('energyMaximum');
        var energyAmount = document.getElementById('energyAmount');
        energyBar.style.width = Math.max(0.5, this.energy / this.maxEnergy * 256) + "px";
        energyOutput.textContent = "+" + this.energyOutput.toFixed(1);
        energyDrain.textContent = "-" + this.energyDrain.toFixed(1);
        energyAmount.textContent = this.energy.toString();
        energyMaximum.textContent = this.maxEnergy.toString();
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
    Game.prototype.drawPrimeNodes = function () {
        var nodes = new Array();
        for (var i = 0; i < this.primeNodes.length; i++) {
            var node = this.primeNodes[i];
            var x = node.x;
            var y = node.y;
            nodes.push({ x: x, y: y, ang: 0, ref: 'prime_node' });
        }
        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, nodes);
    };
    Game.prototype.drawSelectBox = function () {
        var control = this.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            var scale = this.camera.scale;
            var width = this.unitDrawer.width();
            var height = this.unitDrawer.height();
            var x1 = (control.clickX - this.camera.x) * scale;
            var y1 = (control.clickY - this.camera.y) * scale;
            var x2 = (control.currentX - this.camera.x) * scale;
            var y2 = (control.currentY - this.camera.y) * scale;
            var minX = Math.min(x1, x2);
            var minY = Math.min(y1, y2);
            var maxX = Math.max(x1, x2);
            var maxY = Math.max(y1, y2);
            this.selectionBoxDrawer.draw(minX, minY, maxX, maxY);
        }
    };
    Game.prototype.gameXY = function () {
        var self = this;
        return {
            x: (self.camera.x + (self.inputState.mouseX() - self.unitDrawer.width() / 2) / self.camera.scale) / Game.TILESIZE,
            y: (self.camera.y - (self.inputState.mouseY() - self.unitDrawer.height() / 2) / self.camera.scale) / Game.TILESIZE,
        };
    };
    Game.prototype.drawBuildPlacement = function () {
        var control = this.control;
        var input = this.inputState;
        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            var layers = new Array();
            var xy = this.gameXY();
            var hw = control.width * 0.5;
            var hh = control.height * 0.5;
            var x = (Math.floor(xy.x - hw + 0.0001) + hw) * Game.TILESIZE;
            var y = (Math.floor(xy.y - hh + 0.0001) + hh) * Game.TILESIZE;
            for (var i = 0; i < control.imgs.length; i++) {
                layers.push({
                    x: x, y: y, ang: 0.0, ref: control.imgs[i] + this.teamColors[this.team].name
                });
            }
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, layers);
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
        var scale = this.camera.scale;
        var mapW = this.mapWidth * Game.TILESIZE;
        var mapH = this.mapHeight * Game.TILESIZE;
        var drawCanvas = document.getElementById('drawCanvas');
        var w = drawCanvas.clientWidth;
        var h = drawCanvas.clientHeight;
        var hw = w / 2 / scale;
        var hh = h / 2 / scale;
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
        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, flattened);
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
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, this.camera.scale, enemy_selections);
        }
        else {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, this.camera.scale, selections);
        }
        if (onlyEnemyIsBeingSelected) {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, this.camera.scale, enemy_dashed);
        }
        else {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, this.camera.scale, dashed);
        }
    };
    Game.prototype.drawStatusBars = function () {
        var bars = new Array();
        for (var i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.old) {
                var radius = soul.current.radius();
                var x = soul.current.x;
                var y = soul.current.y + radius * Game.TILESIZE;
                var w = soul.current.radius() * Game.TILESIZE;
                var h = 1;
                if (soul.old.progress < 255) {
                    var v = soul.old.progress / 255;
                    var r = 125;
                    var g = 125;
                    var b = 125;
                    var a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.old.health < 255) {
                    var v = soul.old.health / 255;
                    var r = (255 - soul.old.health / 2);
                    var g = 200;
                    var b = soul.old.health;
                    var a = 255;
                    bars.push({ x: x, y: y, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
            }
        }
        this.statusBarDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, bars);
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
        this.fowDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, circles);
    };
    Game.MAX_UNITS = 4096;
    Game.TILESIZE = 20;
    Game.PRIME_NODE_WIDTH = 3;
    Game.FPS = 10;
    return Game;
}());
var Camera = (function () {
    function Camera(x, y, scale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
    return Camera;
}());
