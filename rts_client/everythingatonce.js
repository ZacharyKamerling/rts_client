var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Decoding;
(function (Decoding) {
    var ClientMessage;
    (function (ClientMessage) {
        ClientMessage[ClientMessage["UnitMove"] = 0] = "UnitMove";
        ClientMessage[ClientMessage["UnitDeath"] = 1] = "UnitDeath";
        ClientMessage[ClientMessage["OrderCompleted"] = 2] = "OrderCompleted";
        ClientMessage[ClientMessage["MeleeSmack"] = 3] = "MeleeSmack";
        ClientMessage[ClientMessage["MissileMove"] = 4] = "MissileMove";
        ClientMessage[ClientMessage["MissileExplode"] = 5] = "MissileExplode";
        ClientMessage[ClientMessage["Construction"] = 6] = "Construction";
        ClientMessage[ClientMessage["TeamInfo"] = 7] = "TeamInfo";
        ClientMessage[ClientMessage["MapInfo"] = 8] = "MapInfo";
    })(ClientMessage || (ClientMessage = {}));
    function processPacket(game, data) {
        var currentTime = Date.now();
        var logicFrame = data.getU32();
        if (logicFrame > game.logicFrame) {
            game.logicFrame = logicFrame;
            game.lastLogicFrameTime = currentTime;
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && (logicFrame - soul.new.frameCreated > 2)) {
                    game.souls[i] = null;
                }
            }
            for (var i = 0; i < game.missileSouls.length; i++) {
                var misl_soul = game.missileSouls[i];
                if (misl_soul && (logicFrame - misl_soul.new.frameCreated > 1)) {
                    game.missileSouls[i] = null;
                }
            }
        }
        else if (logicFrame < game.logicFrame) {
            return;
        }
        var _loop_1 = function() {
            var msg_type = data.getU8();
            msg_switch: switch (msg_type) {
                // Unit
                case ClientMessage.UnitMove:
                    var new_unit = Unit.decodeUnit(data, currentTime, logicFrame);
                    // If unit_soul exists, update it with new_unit
                    if (new_unit) {
                        var soul = game.souls[new_unit.unit_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.timeCreated;
                            soul.new = new_unit;
                        }
                        else {
                            cur = new_unit.clone();
                            game.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case ClientMessage.MissileMove:
                case ClientMessage.MissileExplode:
                    var exploding = msg_type === ClientMessage.MissileExplode;
                    var new_misl = Missile.decodeMissile(data, currentTime, logicFrame, exploding);
                    if (new_misl) {
                        var soul = game.missileSouls[new_misl.misl_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.frameCreated;
                            soul.new = new_misl;
                        }
                        else {
                            var cur_1 = new_misl.clone();
                            game.missileSouls[new_misl.misl_ID] = { old: null, current: cur_1, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case ClientMessage.UnitDeath:
                    var unit_ID = data.getU16();
                    var dmg_type = data.getU8();
                    game.souls[unit_ID].current.isDead = true;
                    break msg_switch;
                // Player Info
                case ClientMessage.TeamInfo:
                    game.team = data.getU8();
                    game.maxPrime = data.getU32();
                    game.prime = data.getU32();
                    game.maxEnergy = data.getU32();
                    game.energy = data.getU32();
                    console.log("Prime: " + game.prime + ", Energy: " + game.energy);
                    break msg_switch;
                case ClientMessage.Construction:
                    var builder = data.getU16();
                    var buildee = data.getU16();
                    break msg_switch;
                case ClientMessage.OrderCompleted:
                    var unitID = data.getU16();
                    var orderID = data.getU16();
                    break msg_switch;
                case ClientMessage.MapInfo:
                    var team = data.getU8();
                    var width = data.getU16();
                    var height = data.getU16();
                    game.team = team;
                    game.mapWidth = width;
                    game.mapHeight = height;
                    var canvas = document.createElement('canvas');
                    var mmCanvas = document.createElement('canvas'); //minimap
                    canvas.width = width;
                    canvas.height = height;
                    mmCanvas.width = width;
                    mmCanvas.height = height;
                    var ctx = canvas.getContext('2d');
                    var imgData = ctx.getImageData(0, 0, width, height);
                    var quads = imgData.data;
                    for (var y = 0; y < height; y++) {
                        for (var x = 0; x < width; x++) {
                            var r = data.getU8();
                            var g = data.getU8();
                            var ix = y * width + x;
                            quads[ix * 4] = r;
                            quads[ix * 4 + 1] = g;
                            quads[ix * 4 + 2] = 0;
                            quads[ix * 4 + 3] = 255;
                        }
                    }
                    for (var y = 0; y < height; y++) {
                        for (var x = 0; x < width; x++) {
                            data.getU8();
                        }
                    }
                    var num_locations = data.getU8();
                    for (var n = 0; n < num_locations; n++) {
                        var x = data.getU16();
                        var y = data.getU16();
                        if (n === team) {
                            game.camera.x = x * Game.TILESIZE;
                            game.camera.y = (height - y) * Game.TILESIZE;
                            console.log("Set Map X & Y: " + x + ":" + y);
                        }
                    }
                    console.log("Consumed map data. " + data.offset);
                    ctx.putImageData(imgData, 0, 0);
                    var img_1 = new Image(width, height);
                    img_1.src = canvas.toDataURL();
                    img_1.onload = function (e) {
                        game.tileDrawer.setTiles(img_1);
                        var mainMenu = document.getElementById('mainMenu');
                        mainMenu.appendChild(img_1);
                    };
                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return { value: void 0 };
            }
        };
        var cur;
        while (!data.empty()) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object") return state_1.value;
        }
    }
    Decoding.processPacket = processPacket;
})(Decoding || (Decoding = {}));
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
        this.tileDrawer.draw(this.camera.x, this.camera.y, this.camera.scale);
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
            var half_w = control.width / 2;
            var half_h = control.height / 2;
            var x = Math.floor(xy.x) * Game.TILESIZE;
            var y = Math.floor(xy.y) * Game.TILESIZE;
            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_platform1" + this.teamColors[this.team].name
            });
            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_wpn2" + this.teamColors[this.team].name
            });
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, layers);
        }
    };
    Game.prototype.drawMinimap = function () {
        var layers = new Array(10);
        for (var i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        // Render units
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
        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, flattened);
    };
    Game.prototype.drawSelections = function () {
        var selections = new Array();
        var dashed = new Array();
        var enemy_selections = new Array();
        var enemy_dashed = new Array();
        var onlyEnemyIsBeingSelected = true;
        var onlyEnemyIsSelected = true;
        // Render units
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
        // Render units
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
                    var r = 225;
                    var g = 225;
                    var b = 225;
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
var Interaction;
(function (Interaction) {
    var AttackTargetOrder;
    (function (AttackTargetOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AttackTargetOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.AttackTarget);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        AttackTargetOrder.issue = issue;
    })(AttackTargetOrder = Interaction.AttackTargetOrder || (Interaction.AttackTargetOrder = {}));
})(Interaction || (Interaction = {}));
var Interaction;
(function (Interaction) {
    var AttackMoveOrder;
    (function (AttackMoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AttackMoveOrder.BeingIssued = BeingIssued;
        function issue(game) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.AttackMove);
            game.chef.putU32(game.orderID++);
            var xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        AttackMoveOrder.issue = issue;
    })(AttackMoveOrder = Interaction.AttackMoveOrder || (Interaction.AttackMoveOrder = {}));
})(Interaction || (Interaction = {}));
var Interaction;
(function (Interaction) {
    var BuildOrder;
    (function (BuildOrder) {
        var BeingIssued = (function () {
            function BeingIssued(width, height, type, img) {
                this.width = width;
                this.height = height;
                this.type = type;
                this.img = img;
            }
            return BeingIssued;
        }());
        BuildOrder.BeingIssued = BeingIssued;
        function issue(game, build_type) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.Build);
            game.chef.putU32(game.orderID++);
            game.chef.put16(build_type);
            var xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        BuildOrder.issue = issue;
    })(BuildOrder = Interaction.BuildOrder || (Interaction.BuildOrder = {}));
})(Interaction || (Interaction = {}));
var Interaction;
(function (Interaction) {
    var Minimap;
    (function (Minimap) {
        var MovingCamera = (function () {
            function MovingCamera() {
            }
            return MovingCamera;
        }());
        Minimap.MovingCamera = MovingCamera;
        function interact(game) {
            return function (state, event) {
                var control = game.control;
                var minimapCanvas = document.getElementById('minimapCanvas');
                var bw = minimapCanvas.offsetWidth;
                var bh = minimapCanvas.offsetHeight;
                var w = minimapCanvas.clientWidth;
                var h = minimapCanvas.clientHeight;
                var wDif = (bw - w) / 2;
                var hDif = (bh - h) / 2;
                var mapW = game.mapWidth * Game.TILESIZE;
                var mapH = game.mapHeight * Game.TILESIZE;
                var x = Math.min(1, Math.max(0, (state.mouseX() - wDif) / w)) * mapW;
                var y = Math.min(1, Math.max(0, (1 - (state.mouseY() - hDif) / h))) * mapH;
                if (control instanceof Interaction.Core.DoingNothing) {
                    if (event === UserInput.InputEvent.MouseLeftDown) {
                        game.control = new Minimap.MovingCamera();
                        game.camera.x = x;
                        game.camera.y = y;
                    }
                }
                else if (control instanceof Minimap.MovingCamera) {
                    if (event === UserInput.InputEvent.MouseMove) {
                        game.control = new Minimap.MovingCamera();
                        var w_1 = game.mapWidth * Game.TILESIZE;
                        var h_1 = game.mapHeight * Game.TILESIZE;
                        game.camera.x = x;
                        game.camera.y = y;
                    }
                    else {
                        game.control = new Interaction.Core.DoingNothing();
                    }
                }
            };
        }
        Minimap.interact = interact;
    })(Minimap = Interaction.Minimap || (Interaction.Minimap = {}));
})(Interaction || (Interaction = {}));
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
                        game.camera.scale = Math.max(0.5, Math.min(2, game.camera.scale - 0.002 * game.inputState.wheelChange()));
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
var Interaction;
(function (Interaction) {
    var AssistOrder;
    (function (AssistOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AssistOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.Assist);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                if (game.souls[selected[i]].new.unit_ID !== unitID) {
                    game.chef.put16(selected[i]);
                }
            }
            game.connection.send(game.chef.done());
        }
        AssistOrder.issue = issue;
    })(AssistOrder = Interaction.AssistOrder || (Interaction.AssistOrder = {}));
})(Interaction || (Interaction = {}));
var Interaction;
(function (Interaction) {
    var MoveOrder;
    (function (MoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        MoveOrder.BeingIssued = BeingIssued;
        function issue(game) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.Move);
            game.chef.putU32(game.orderID++);
            var xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        MoveOrder.issue = issue;
    })(MoveOrder = Interaction.MoveOrder || (Interaction.MoveOrder = {}));
})(Interaction || (Interaction = {}));
var Interaction;
(function (Interaction) {
    var MovingCamera = (function () {
        function MovingCamera(mx, my, cx, cy) {
            this.clickX = mx;
            this.clickY = my;
            this.cameraX = cx;
            this.cameraY = cy;
        }
        return MovingCamera;
    }());
    Interaction.MovingCamera = MovingCamera;
})(Interaction || (Interaction = {}));
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
                        if (soul.current.isBeingSelected) {
                            soul.current.isSelected = true;
                        }
                        else if (!game.inputState.shiftDown()) {
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
                var x1 = control.clickX;
                var x2 = control.currentX;
                var y1 = control.clickY;
                var y2 = control.currentY;
                configureUnitsBeingSelected(game, x1, y1, x2, y2);
            }
            if (control instanceof Interaction.Core.DoingNothing) {
                var input = game.inputState;
                var width = game.unitDrawer.width();
                var height = game.unitDrawer.height();
                var scale = game.camera.scale;
                var x = game.camera.x + (input.mouseX() - width / 2) / scale;
                var y = game.camera.y - (input.mouseY() - height / 2) / scale;
                configureUnitsBeingSelected(game, x, y, x, y);
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
                if (soul && soul.new) {
                    var x = soul.current.x;
                    var y = soul.current.y;
                    var r = soul.current.radius() * Game.TILESIZE;
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
        function begin(game) {
            var scale = game.camera.scale;
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            var x = game.camera.x + (input.mouseX() - width / 2) / scale;
            var y = game.camera.y - (input.mouseY() - height / 2) / scale;
            game.control = new Interaction.SelectingUnits.CurrentAction(x, y, x, y, game.inputState.shiftDown());
            if (!input.shiftDown()) {
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
var MissileType;
(function (MissileType) {
    MissileType[MissileType["Fast1"] = 0] = "Fast1";
    MissileType[MissileType["TestUnit"] = 1] = "TestUnit";
    MissileType[MissileType["TestStructure"] = 2] = "TestStructure";
})(MissileType || (MissileType = {}));
var Missile = (function () {
    function Missile(c, time, frame, exploding) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.exploding = exploding;
            this.misl_ID = c.getU16();
            this.x = c.getU16() / (64 / Game.TILESIZE);
            this.y = c.getU16() / (64 / Game.TILESIZE);
            this.team = c.getU8();
        }
    }
    Missile.prototype.clone = function () {
        throw new Error('Missile: clone() is abstract');
    };
    Missile.prototype.copycat = function (misl) {
        misl.misl_ID = this.misl_ID;
        misl.x = this.x;
        misl.y = this.y;
        misl.team = this.team;
        misl.exploding = this.exploding;
        misl.frameCreated = this.frameCreated;
        misl.timeCreated = this.timeCreated;
    };
    Missile.prototype.render = function (game, layers) {
        throw new Error('Missile: render() is abstract');
    };
    Missile.prototype.renderExplosion = function (game, layers) {
        throw new Error('Missile: renderExplosion() is abstract');
    };
    Missile.prototype.speed = function () {
        throw new Error('Missile: speed() is abstract');
    };
    Missile.prototype.step = function (fps, timeDelta, oldMisl, newMisl) {
        var speed = this.speed() * Game.TILESIZE / Game.FPS;
        this.facing = Math.atan2(newMisl.y - oldMisl.y, newMisl.x - oldMisl.x);
        this.x += speed * Math.cos(this.facing) * timeDelta;
        this.y += speed * Math.sin(this.facing) * timeDelta;
        var xDifA = this.x - oldMisl.x;
        var yDifA = this.y - oldMisl.y;
        var xDifB = oldMisl.x - newMisl.x;
        var yDifB = oldMisl.y - newMisl.y;
        var distA = xDifA * xDifA + yDifA * yDifA;
        var distB = xDifB * xDifB + yDifB * yDifB;
        if (newMisl.exploding && distA > distB) {
            this.exploding = true;
        }
    };
    Missile.decodeMissile = function (data, time, frame, exploding) {
        var mislType = data.getU8();
        switch (mislType) {
            case MissileType.TestUnit:
                return new BasicMissile(data, time, frame, exploding);
            case MissileType.TestStructure:
                return new BasicMissile(data, time, frame, exploding);
            case MissileType.Fast1:
                return new BasicMissile(data, time, frame, exploding);
            default:
                console.log("No missile of type " + mislType + " exists.");
                return null;
        }
    };
    return Missile;
}());
var UnitType;
(function (UnitType) {
    UnitType[UnitType["Fast1"] = 0] = "Fast1";
    UnitType[UnitType["TestUnit"] = 1] = "TestUnit";
    UnitType[UnitType["TestStructure"] = 2] = "TestStructure";
})(UnitType || (UnitType = {}));
var Unit = (function () {
    function Unit(c, time, frame) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.unit_ID = c.getU16();
            this.x = c.getU16() / 64 * Game.TILESIZE;
            this.y = c.getU16() / 64 * Game.TILESIZE;
            this.anim_ID = c.getU8();
            this.team = c.getU8();
            this.facing = c.getU8() * 2 * Math.PI / 255;
            this.health = c.getU8();
            this.progress = c.getU8();
        }
    }
    Unit.prototype.copycat = function (unit) {
        unit.unit_ID = this.unit_ID;
        unit.anim_ID = this.anim_ID;
        unit.team = this.team;
        unit.x = this.x;
        unit.y = this.y;
        unit.facing = this.facing;
        unit.health = this.health;
        unit.progress = this.progress;
        unit.frameCreated = this.frameCreated;
        unit.timeCreated = this.timeCreated;
        unit.isSelected = this.isSelected;
        unit.isBeingSelected = this.isBeingSelected;
    };
    Unit.prototype.clone = function () {
        throw new Error('Unit: clone() is abstract');
    };
    Unit.prototype.sightRadius = function () {
        throw new Error('Unit: getSightRadius() is abstract');
    };
    Unit.prototype.radius = function () {
        throw new Error('Unit: getRadius() is abstract');
    };
    Unit.prototype.widthAndHeight = function () {
        throw new Error('Unit: widthAndHeight() is abstract');
    };
    Unit.prototype.render = function (game, layers) {
        throw new Error('Unit: render() is abstract');
    };
    Unit.prototype.renderMinimap = function (game, layers) {
        throw new Error('Unit: render() is abstract');
    };
    Unit.prototype.renderDeath = function (game, layers) {
        throw new Error('Unit: render() is abstract');
    };
    Unit.prototype.commands = function (cmds) {
        throw new Error('Unit: commands() is abstract');
    };
    Unit.prototype.buildables = function (blds) {
        throw new Error('Unit: buildables() is abstract');
    };
    Unit.prototype.step = function (timeDelta, oldUnit, newUnit) {
        var f1 = oldUnit.facing;
        var f2 = newUnit.facing;
        var turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.facing = Misc.turnTowards(this.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        if (newUnit.progress === oldUnit.progress) {
            this.progress = newUnit.progress;
        }
        else {
            this.progress = this.progress + (newUnit.progress - oldUnit.progress) * timeDelta;
        }
        if (newUnit.health === oldUnit.health) {
            this.health = newUnit.health;
        }
        else {
            this.health = this.health + (newUnit.health - oldUnit.health) * timeDelta;
        }
    };
    Unit.decodeUnit = function (data, time, frame) {
        var unitType = data.getU8();
        switch (unitType) {
            case UnitType.TestUnit:
                return new BasicUnit(data, time, frame);
            case UnitType.TestStructure:
                return new BasicStructure(data, time, frame);
            case UnitType.Fast1:
                return new Fast1(data, time, frame);
            default:
                console.log("No unit of type " + unitType + " exists.");
                return null;
        }
    };
    return Unit;
}());
"use strict";
// Consumes binary data
var Cereal = (function () {
    function Cereal(dv) {
        this.offset = 0;
        this.dv = dv;
    }
    Cereal.prototype.get8 = function () {
        var val = this.dv.getInt8(this.offset);
        this.offset = this.offset + 1;
        return val;
    };
    Cereal.prototype.getU8 = function () {
        var val = this.dv.getUint8(this.offset);
        this.offset = this.offset + 1;
        return val;
    };
    Cereal.prototype.get16 = function () {
        var val = this.dv.getInt16(this.offset);
        this.offset = this.offset + 2;
        return val;
    };
    Cereal.prototype.getU16 = function () {
        var val = this.dv.getUint16(this.offset);
        this.offset = this.offset + 2;
        return val;
    };
    Cereal.prototype.get32 = function () {
        var val = this.dv.getInt32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getU32 = function () {
        var val = this.dv.getUint32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getF32 = function () {
        var val = this.dv.getFloat32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getF64 = function () {
        var val = this.dv.getFloat64(this.offset);
        this.offset = this.offset + 8;
        return val;
    };
    Cereal.prototype.empty = function () {
        return (this.dv.byteLength === this.offset);
    };
    return Cereal;
}());
function uintToString(uintArray) {
    return decodeURIComponent(encodeURI(atob(String.fromCharCode.apply(null, uintArray))));
}
// Cooks up binary data
var Chef = (function () {
    function Chef() {
        this.ab = new ArrayBuffer(4096);
        this.dv = new DataView(this.ab);
        this.offset = 0;
    }
    Chef.prototype.resize = function (spaceNeeded) {
        if (this.ab.byteLength < this.offset + spaceNeeded) {
            var newAB = new ArrayBuffer((this.ab.byteLength + spaceNeeded) * 2);
            var newDV = new DataView(newAB);
            for (var i = 0; i < this.offset; i++) {
                newDV.setInt8(i, this.dv.getInt8(i));
            }
            this.dv = newDV;
            this.ab = newAB;
        }
    };
    // Trim empty space and get array buffer
    Chef.prototype.done = function () {
        var newAB = new ArrayBuffer(this.offset);
        var newDV = new DataView(newAB);
        for (var i = 0; i < this.offset; i++) {
            newDV.setInt8(i, this.dv.getInt8(i));
        }
        this.offset = 0;
        return newAB;
    };
    Chef.prototype.putString = function (str) {
        var strBuff = this.toUTF8Array(str);
        this.resize(strBuff.length + 2);
        this.dv.setUint16(this.offset, strBuff.length);
        this.offset = this.offset + 2;
        for (var i = 0; i < strBuff.length; i++) {
            this.putU8(strBuff[i]);
        }
    };
    Chef.prototype.put8 = function (v) {
        this.resize(1);
        this.dv.setInt8(this.offset, v);
        this.offset = this.offset + 1;
    };
    Chef.prototype.putU8 = function (v) {
        this.resize(1);
        this.dv.setUint8(this.offset, v);
        this.offset = this.offset + 1;
    };
    Chef.prototype.put16 = function (v) {
        this.resize(2);
        this.dv.setInt16(this.offset, v);
        this.offset = this.offset + 2;
    };
    Chef.prototype.putU16 = function (v) {
        this.resize(2);
        this.dv.setUint16(this.offset, v);
        this.offset = this.offset + 2;
    };
    Chef.prototype.putU32 = function (v) {
        this.resize(4);
        this.dv.setUint32(this.offset, v);
        this.offset = this.offset + 4;
    };
    Chef.prototype.put32 = function (v) {
        this.resize(4);
        this.dv.setInt32(this.offset, v);
        this.offset = this.offset + 4;
    };
    Chef.prototype.putF32 = function (v) {
        this.resize(4);
        this.dv.setFloat32(this.offset, v);
        this.offset = this.offset + 4;
    };
    Chef.prototype.putF64 = function (v) {
        this.resize(8);
        this.dv.setFloat64(this.offset, v);
        this.offset = this.offset + 8;
    };
    Chef.prototype.toUTF8Array = function (str) {
        var utf8 = [];
        for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80)
                utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
            }
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                    | (str.charCodeAt(i) & 0x3ff));
                utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
            }
        }
        return utf8;
    };
    return Chef;
}());
var Grid = (function () {
    function Grid(w, h) {
        this.w = w;
        this.h = h;
        this.node_state = new Uint8Array(new ArrayBuffer(w * h));
        for (var i = 0; i < w * h; i++) {
            this.node_state[i] = 0;
        }
    }
    Grid.prototype.isOpen = function (x, y) {
        return this.inBounds(x, y) && this.node_state[this.w * y + x] === 0;
    };
    Grid.prototype.set = function (x, y, upd) {
        if (this.inBounds(x, y)) {
            this.node_state[this.w * y + x] = upd;
        }
    };
    Grid.prototype.inBounds = function (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    };
    return Grid;
}());
var UserInput;
(function (UserInput) {
    (function (InputEvent) {
        InputEvent[InputEvent["MouseMove"] = 0] = "MouseMove";
        InputEvent[InputEvent["MouseLeftDown"] = 1] = "MouseLeftDown";
        InputEvent[InputEvent["MouseMiddleDown"] = 2] = "MouseMiddleDown";
        InputEvent[InputEvent["MouseRightDown"] = 3] = "MouseRightDown";
        InputEvent[InputEvent["MouseLeftUp"] = 4] = "MouseLeftUp";
        InputEvent[InputEvent["MouseMiddleUp"] = 5] = "MouseMiddleUp";
        InputEvent[InputEvent["MouseRightUp"] = 6] = "MouseRightUp";
        InputEvent[InputEvent["MouseWheel"] = 7] = "MouseWheel";
        InputEvent[InputEvent["KeyDown"] = 8] = "KeyDown";
        InputEvent[InputEvent["KeyUp"] = 9] = "KeyUp";
    })(UserInput.InputEvent || (UserInput.InputEvent = {}));
    var InputEvent = UserInput.InputEvent;
    var InputState = (function () {
        function InputState() {
            this._elements = new Array();
            this._listener = null;
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
        }
        InputState.prototype.elements = function () { return this._elements; };
        InputState.prototype.shiftDown = function () { return this._shift; };
        InputState.prototype.ctrlDown = function () { return this._ctrl; };
        InputState.prototype.altDown = function () { return this._alt; };
        InputState.prototype.mouseX = function () { return this._mouseX; };
        InputState.prototype.mouseY = function () { return this._mouseY; };
        InputState.prototype.mouseLeftDown = function () { return this._mouseLeft; };
        InputState.prototype.mouseMiddleDown = function () { return this._mouseMiddle; };
        InputState.prototype.MouseRightDown = function () { return this._mouseRight; };
        InputState.prototype.lastKeyPressed = function () { return this._lastKeyPressed; };
        InputState.prototype.wheelChange = function () { return this._wheelChange; };
        InputState.prototype.addListener = function (parent, handler) {
            var self = this;
            self._elements.push(parent);
            parent.draggable = false;
            parent.addEventListener("wheel", function (e) {
                var event = InputEvent.MouseWheel;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._wheelChange = e.deltaY;
                handler(self, event);
                pauseEvent(e);
            });
            parent.addEventListener("mousedown", function (e) {
                var event;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                self._mouseStartX = e.x;
                self._mouseStartY = e.y;
                switch (e.button) {
                    case 0:
                        event = InputEvent.MouseLeftDown;
                        self._mouseLeft = true;
                        break;
                    case 1:
                        event = InputEvent.MouseMiddleDown;
                        self._mouseMiddle = true;
                        break;
                    case 2:
                        event = InputEvent.MouseRightDown;
                        self._mouseRight = true;
                        break;
                    default:
                        alert("Bad mouse down input.");
                        break;
                }
                handler(self, event);
                pauseEvent(e);
            });
            window.addEventListener("mouseup", function (e) {
                var event;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                switch (e.button) {
                    case 0:
                        event = InputEvent.MouseLeftUp;
                        self._mouseLeft = false;
                        break;
                    case 1:
                        event = InputEvent.MouseMiddleUp;
                        self._mouseMiddle = false;
                        break;
                    case 2:
                        event = InputEvent.MouseRightUp;
                        self._mouseRight = false;
                        break;
                    default:
                        alert("Bad mouse down input.");
                        break;
                }
                handler(self, event);
                pauseEvent(e);
            });
            window.addEventListener("mousemove", function (e) {
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                handler(self, InputEvent.MouseMove);
                pauseEvent(e);
            });
            window.addEventListener("keydown", function (e) {
                if (e.keyCode === 122 || e.keyCode === 123) {
                    return true;
                }
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._lastKeyPressed = e.keyCode;
                handler(self, InputEvent.KeyDown);
                pauseEvent(e);
            });
            window.addEventListener("keyup", function (e) {
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._lastKeyPressed = e.keyCode;
                handler(self, InputEvent.KeyUp);
                pauseEvent(e);
            });
            /*
            parent.addEventListener("touchstart", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchend", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchcancel", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchleave", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchmove", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
            */
        };
        return InputState;
    }());
    UserInput.InputState = InputState;
    function pauseEvent(e) {
        if (e.stopPropagation)
            e.stopPropagation();
        if (e.stopImmediatePropagation)
            e.stopImmediatePropagation;
        if (e.preventDefault)
            e.preventDefault();
        e.cancelBubble = true;
        return false;
    }
})(UserInput || (UserInput = {}));
var CommandPanel = (function () {
    function CommandPanel(parent, commands, handler) {
        this.parent = parent;
        this.commands = commands;
        this.handler = handler;
    }
    CommandPanel.prototype.renderCommands = function (cmds) {
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }
        for (var i = 0; i < cmds.length; i++) {
            var self_1 = this;
            var cmd = cmds[i];
            var btn = document.createElement("input");
            btn.name = cmd;
            btn.type = "image";
            btn.title = this.commands[cmd].tooltip;
            btn.src = this.commands[cmd].src;
            btn.onclick = function (name, handler) {
                return function (event) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    handler(name);
                };
            }(btn.name, self_1.handler);
            this.parent.appendChild(btn);
        }
    };
    return CommandPanel;
}());
var SelectionDrawer = (function () {
    function SelectionDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, SelectionDrawer.vertexShader, SelectionDrawer.fragmentShader));
        this.programDashed = new MetaProgram(gl, createProgram(gl, SelectionDrawer.vertexShader, SelectionDrawer.fragmentShaderDashed));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    SelectionDrawer.prototype.draw = function (dashed, x, y, scale, circles) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var xm = 1 / this.canvas.width;
        var ym = 1 / this.canvas.height;
        var BYTES_PER_VERTEX = 24;
        var drawData = new ArrayBuffer(6 * BYTES_PER_VERTEX * circles.length);
        var floatView = new Float32Array(drawData);
        var uint8View = new Uint8Array(drawData);
        for (var n = 0; n < circles.length; n++) {
            var circle = circles[n];
            circle.x *= scale;
            circle.y *= scale;
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            circle.radius *= 2 * scale;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((circle.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((circle.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + circle.radius * xm;
            var north = normY + circle.radius * ym;
            var west = normX - circle.radius * xm;
            var south = normY - circle.radius * ym;
            var radius = circle.radius * xm;
            // Fill array with scaled vertices
            var vertFloatOff = n * 6 * BYTES_PER_VERTEX / 4;
            var vertUInt8Off = n * 6 * BYTES_PER_VERTEX + 20;
            var floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 0;
            var colorOff = vertUInt8Off + BYTES_PER_VERTEX * 0;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 1;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 1;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 2;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 2;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 3;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 3;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 4;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 4;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 5;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 5;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        var att;
        var uni;
        if (dashed) {
            gl.useProgram(this.programDashed.program);
            att = this.programDashed.attribute;
            uni = this.programDashed.uniform;
        }
        else {
            gl.useProgram(this.program.program);
            att = this.program.attribute;
            uni = this.program.uniform;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(att['a_position']);
        gl.enableVertexAttribArray(att['a_circle_position']);
        gl.enableVertexAttribArray(att['a_circle_radius']);
        gl.enableVertexAttribArray(att['a_circle_color']);
        gl.vertexAttribPointer(att['a_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
        gl.vertexAttribPointer(att['a_circle_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
        gl.vertexAttribPointer(att['a_circle_radius'], 1, gl.FLOAT, false, BYTES_PER_VERTEX, 16);
        gl.vertexAttribPointer(att['a_circle_color'], 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 20);
        gl.uniform1f(uni['scaleY'], this.canvas.width / this.canvas.height);
        gl.uniform1f(uni['scale'], 2 / this.canvas.width);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);
    };
    SelectionDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_circle_position;",
        "attribute float a_circle_radius;",
        "attribute vec4 a_circle_color;",
        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "varying vec4 v_circle_color;",
        "uniform float scaleY;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_circle_position = a_circle_position;",
        "    v_frag_position = a_position;",
        "    v_circle_radius = a_circle_radius;",
        "    v_circle_color = a_circle_color;",
        "}",
    ].join("\n");
    SelectionDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "varying vec4 v_circle_color;",
        "uniform float scaleY;",
        "uniform float scale;",
        "void main() {",
        "    float xDif = v_frag_position.x - v_circle_position.x;",
        "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
        "    float dist = xDif * xDif + yDif * yDif;",
        "    float radi = v_circle_radius - scale;",
        "    if (dist <= (v_circle_radius * v_circle_radius) && dist >= (radi * radi)) {",
        "        gl_FragColor = v_circle_color;",
        "    } else {",
        "        discard;",
        "    }",
        "}",
    ].join("\n");
    SelectionDrawer.fragmentShaderDashed = [
        "precision highp float;",
        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "varying vec4 v_circle_color;",
        "uniform float scaleY;",
        "uniform float scale;",
        "void main() {",
        "    float xDif = v_frag_position.x - v_circle_position.x;",
        "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
        "    float angl = atan(yDif, xDif);",
        "    float dist = xDif * xDif + yDif * yDif;",
        "    float radi = v_circle_radius - scale;",
        "    if (dist <= (v_circle_radius * v_circle_radius) && dist >= (radi * radi) && mod(angl, 0.39269908169872415480783042290994) >= 0.19634954084936207740391521145497) {",
        "        gl_FragColor = v_circle_color;",
        "    } else {",
        "        discard;",
        "    }",
        "}",
    ].join("\n");
    return SelectionDrawer;
}());
var FOWDrawer = (function () {
    function FOWDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, FOWDrawer.vertexShader, FOWDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    FOWDrawer.prototype.draw = function (x, y, scale, circles) {
        var QUALITY = 1 / 4;
        x = Math.floor(x * QUALITY * scale);
        y = Math.floor(y * QUALITY * scale);
        this.canvas.width = Math.floor(this.canvas.offsetWidth * QUALITY);
        this.canvas.height = Math.floor(this.canvas.offsetHeight * QUALITY);
        var FLOATS_PER_UNIT = 30;
        var drawData = new Float32Array(FLOATS_PER_UNIT * circles.length);
        var xm = Game.TILESIZE / this.canvas.width;
        var ym = Game.TILESIZE / this.canvas.height;
        for (var i = 0, n = 0; n < circles.length; n++) {
            var circle = circles[n];
            // Scale all coords to 1/4th their size (to match small canvas)
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            circle.r = (circle.r * QUALITY) * 2 * scale;
            circle.x = circle.x * QUALITY * scale;
            circle.y = circle.y * QUALITY * scale;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((circle.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((circle.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + circle.r * xm;
            var north = normY + circle.r * ym;
            var west = normX - circle.r * xm;
            var south = normY - circle.r * ym;
            var radius = circle.r * xm;
            // Fill array with scaled vertices
            drawData[i + 0] = west;
            drawData[i + 1] = south;
            drawData[i + 2] = normX;
            drawData[i + 3] = normY;
            drawData[i + 4] = radius;
            drawData[i + 5] = east;
            drawData[i + 6] = south;
            drawData[i + 7] = normX;
            drawData[i + 8] = normY;
            drawData[i + 9] = radius;
            drawData[i + 10] = east;
            drawData[i + 11] = north;
            drawData[i + 12] = normX;
            drawData[i + 13] = normY;
            drawData[i + 14] = radius;
            drawData[i + 15] = west;
            drawData[i + 16] = south;
            drawData[i + 17] = normX;
            drawData[i + 18] = normY;
            drawData[i + 19] = radius;
            drawData[i + 20] = east;
            drawData[i + 21] = north;
            drawData[i + 22] = normX;
            drawData[i + 23] = normY;
            drawData[i + 24] = radius;
            drawData[i + 25] = west;
            drawData[i + 26] = north;
            drawData[i + 27] = normX;
            drawData[i + 28] = normY;
            drawData[i + 29] = radius;
            i += FLOATS_PER_UNIT;
        }
        var gl = this.canvas.getContext('webgl');
        gl.clearColor(0, 0, 0, 0.75);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_radius']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(this.program.attribute['a_circle_position'], 2, gl.FLOAT, false, 20, 8);
        gl.vertexAttribPointer(this.program.attribute['a_circle_radius'], 1, gl.FLOAT, false, 20, 16);
        gl.uniform1f(this.program.uniform['scaleY'], this.canvas.width / this.canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);
    };
    FOWDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_circle_position;",
        "attribute float a_circle_radius;",
        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "uniform float scaleY;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_circle_position = a_circle_position;",
        "    v_frag_position = a_position;",
        "    v_circle_radius = a_circle_radius;",
        "}",
    ].join("\n");
    FOWDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "uniform float scaleY;",
        "void main() {",
        "    float xDif = v_frag_position.x - v_circle_position.x;",
        "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
        "    float dist = xDif * xDif + yDif * yDif;",
        "    if (dist < (v_circle_radius * v_circle_radius)) {",
        "        gl_FragColor = vec4(0, 0, 0, 0.0);",
        "    } else {",
        "        discard;",
        "    }",
        "}",
    ].join("\n");
    return FOWDrawer;
}());
var MinimapBoxDrawer = (function () {
    function MinimapBoxDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, MinimapBoxDrawer.vertexShader, MinimapBoxDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    MinimapBoxDrawer.prototype.draw = function (x, y, x2, y2) {
        var drawData = new Float32Array(8);
        var west = Math.min(x, x2);
        var east = Math.max(x, x2);
        var south = Math.min(y, y2);
        var north = Math.max(y, y2);
        // Fill array with vertices
        drawData[0] = west;
        drawData[1] = south;
        drawData[2] = west;
        drawData[3] = north;
        drawData[4] = east;
        drawData[5] = north;
        drawData[6] = east;
        drawData[7] = south;
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    };
    MinimapBoxDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "}",
    ].join("\n");
    MinimapBoxDrawer.fragmentShader = [
        "precision highp float;",
        "void main() {",
        "    gl_FragColor = vec4(1, 1, 0, 1);",
        "}",
    ].join("\n");
    return MinimapBoxDrawer;
}());
var SelectionBoxDrawer = (function () {
    function SelectionBoxDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, SelectionBoxDrawer.vertexShader, SelectionBoxDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    SelectionBoxDrawer.prototype.draw = function (x, y, x2, y2) {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var w = this.canvas.width;
        var h = this.canvas.height;
        x = (x / w) * 2;
        y = (y / h) * 2;
        x2 = (x2 / w) * 2;
        y2 = (y2 / h) * 2;
        var drawData = new Float32Array(8);
        var west = Math.min(x, x2);
        var east = Math.max(x, x2);
        var south = Math.min(y, y2);
        var north = Math.max(y, y2);
        // Fill array with vertices
        drawData[0] = west;
        drawData[1] = south;
        drawData[2] = west;
        drawData[3] = north;
        drawData[4] = east;
        drawData[5] = north;
        drawData[6] = east;
        drawData[7] = south;
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    };
    SelectionBoxDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "}",
    ].join("\n");
    SelectionBoxDrawer.fragmentShader = [
        "precision highp float;",
        "void main() {",
        "    gl_FragColor = vec4(0, 1, 0, 1);",
        "}",
    ].join("\n");
    return SelectionBoxDrawer;
}());
var Misc;
(function (Misc) {
    function normalizeAngle(f) {
        while (f > Math.PI * 2.0) {
            f -= Math.PI * 2.0;
        }
        while (f < 0.0) {
            f += Math.PI * 2.0;
        }
        return f;
    }
    Misc.normalizeAngle = normalizeAngle;
    function angularDistance(a, b) {
        var dists = Math.abs(a - b);
        if (dists > Math.PI) {
            return 2.0 * Math.PI - dists;
        }
        else {
            return dists;
        }
    }
    Misc.angularDistance = angularDistance;
    // Angle to turn, angle to turn towards, amount to turn
    function turnTowards(a, b, turn) {
        var dist = angularDistance(a, b);
        if (a > b) {
            if (a - b > Math.PI) {
                return normalizeAngle(a + turn);
            }
            else {
                return normalizeAngle(a - turn);
            }
        }
        else {
            if (b - a > Math.PI) {
                return normalizeAngle(a - turn);
            }
            else {
                return normalizeAngle(a + turn);
            }
        }
    }
    Misc.turnTowards = turnTowards;
    function rotateAroundOrigin(cx, cy, x, y, ang) {
        // translate point to origin
        var tempX = x - cx;
        var tempY = y - cy;
        var cos = Math.cos(ang);
        var sin = Math.sin(ang);
        // now apply rotation
        var rotatedX = tempX * cos - tempY * sin;
        var rotatedY = tempX * sin + tempY * cos;
        // translate back
        x = rotatedX + cx;
        y = rotatedY + cy;
        return { x: x, y: y };
    }
    Misc.rotateAroundOrigin = rotateAroundOrigin;
    function rotatePoint(x, y, angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return { x: x * cos - y * sin, y: x * sin + y * cos };
    }
    Misc.rotatePoint = rotatePoint;
})(Misc || (Misc = {}));
var SpriteMap = (function () {
    function SpriteMap(stuff) {
        this.map = {};
        var spriteSheet = document.createElement('canvas');
        spriteSheet.width = SpriteMap.WIDTH;
        spriteSheet.height = SpriteMap.HEIGHT;
        var ctx = spriteSheet.getContext('2d');
        var that = this;
        var x = 0;
        var y = 0;
        var max_h = 0;
        var count = 0;
        var imgs = Array(stuff.length);
        for (var i = 0; i < stuff.length; i++) {
            var sprite = stuff[i];
            var img = document.createElement('img');
            imgs[i] = { ref: sprite.ref, img: img, color: sprite.color };
            img.src = sprite.src;
            img.onload = function () {
                return function (event) {
                    count++;
                    if (count === stuff.length) {
                        imgs.sort(function (a, b) {
                            return b.img.width * b.img.height - a.img.width * a.img.height;
                        });
                        for (var n = 0; n < imgs.length; n++) {
                            var w = imgs[n].img.width;
                            var h = imgs[n].img.height;
                            var color = imgs[n].color;
                            if (w > SpriteMap.WIDTH || h > SpriteMap.HEIGHT) {
                                console.error('IMAGE LARGER THAN SPRITEMAP!');
                                return;
                            }
                            if (x + w > SpriteMap.WIDTH) {
                                x = 0;
                                y += max_h + 1;
                                max_h = 0;
                            }
                            if (y + h > SpriteMap.HEIGHT) {
                                console.error('SPRITEMAP NOT LARGE ENOUGH!');
                                return;
                            }
                            if (h > max_h) {
                                max_h = h;
                            }
                            ctx.drawImage(imgs[n].img, x, y, w, h);
                            if (color) {
                                var imgData = ctx.getImageData(x, y, w, h);
                                var data = imgData.data;
                                for (var i = 0; i < data.length; i += 4) {
                                    if (data[i] === 255) {
                                        var intensity = data[i + 1];
                                        data[i] = color.red * intensity;
                                        data[i + 1] = color.green * intensity;
                                        data[i + 2] = color.blue * intensity;
                                    }
                                }
                                ctx.putImageData(imgData, x, y);
                            }
                            that.map[imgs[n].ref] = {
                                x: x / SpriteMap.WIDTH,
                                y: y / SpriteMap.HEIGHT,
                                w: w / SpriteMap.WIDTH,
                                h: h / SpriteMap.HEIGHT
                            };
                            x += w + 1;
                        }
                        that.spriteSheet = new Image(SpriteMap.WIDTH, SpriteMap.HEIGHT);
                        that.spriteSheet.src = spriteSheet.toDataURL();
                        that.spriteSheet.onload = function (e) {
                            that.onload(e);
                        };
                    }
                };
            }();
        }
    }
    SpriteMap.prototype.coords = function (ref) {
        return this.map[ref];
    };
    SpriteMap.WIDTH = 4096;
    SpriteMap.HEIGHT = 4096;
    return SpriteMap;
}());
var StatusBarDrawer = (function () {
    function StatusBarDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, StatusBarDrawer.vertexShader, StatusBarDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    StatusBarDrawer.prototype.draw = function (x, y, scale, bars) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var xm = 1 / this.canvas.width;
        var ym = 1 / this.canvas.height;
        var BYTES_PER_VERTEX = 16;
        var drawData = new ArrayBuffer(6 * BYTES_PER_VERTEX * bars.length);
        var floatView = new Float32Array(drawData);
        var uint8View = new Uint8Array(drawData);
        for (var n = 0; n < bars.length; n++) {
            var bar = bars[n];
            bar.x *= scale;
            bar.y *= scale;
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the width/height
            bar.w *= scale * 2;
            bar.h *= scale * 2;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((bar.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((bar.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + bar.w * xm;
            var north = normY + bar.h * ym;
            var west = normX - bar.w * xm;
            var south = normY - bar.h * ym;
            var value = west + (east - west) * bar.v;
            // Fill array with scaled vertices
            var vertFloatOff = n * 6 * BYTES_PER_VERTEX / 4;
            var vertUInt8Off = n * 6 * BYTES_PER_VERTEX + 12;
            var floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 0;
            var colorOff = vertUInt8Off + BYTES_PER_VERTEX * 0;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 1;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 1;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 2;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 2;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 3;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 3;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 4;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 4;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 5;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 5;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_bar_value']);
        gl.enableVertexAttribArray(this.program.attribute['a_bar_color']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
        gl.vertexAttribPointer(this.program.attribute['a_value'], 1, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
        gl.vertexAttribPointer(this.program.attribute['a_color'], 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 12);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * bars.length);
    };
    StatusBarDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute float a_value;",
        "attribute vec4 a_color;",
        "varying float v_position;",
        "varying float v_value;",
        "varying vec4 v_color;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_position = a_position.x;",
        "    v_value = a_value;",
        "    v_color = a_color;",
        "}",
    ].join("\n");
    StatusBarDrawer.fragmentShader = [
        "precision highp float;",
        "varying float v_position;",
        "varying float v_value;",
        "varying vec4 v_color;",
        "void main() {",
        "    if (v_position <= v_value) {",
        "        gl_FragColor = v_color;",
        "    } else {",
        "        gl_FragColor = vec4(0,0,0,v_color.a);",
        "    }",
        "}",
    ].join("\n");
    return StatusBarDrawer;
}());
var TeamColor = (function () {
    function TeamColor() {
    }
    TeamColor.prototype.clone = function () {
        var tc = new TeamColor();
        tc.name = this.name;
        tc.red = this.red;
        tc.green = this.green;
        tc.blue = this.blue;
        return tc;
    };
    return TeamColor;
}());
var BuildPlacementDrawer = (function () {
    function BuildPlacementDrawer(canvas, spritemap) {
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, BuildPlacementDrawer.vertexShader, BuildPlacementDrawer.fragmentShader));
        this.spriteTex = gl.createTexture();
        this.spriteMap = spritemap;
        gl.bindTexture(gl.TEXTURE_2D, self.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    BuildPlacementDrawer.prototype.draw = function (x, y, scale, sprites) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_VERT = 4;
        var FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprite.ref);
            if (!xywh) {
                console.log(sprite.ref);
                return;
            }
            var hw = xywh.w * scale; // Half width
            var hh = xywh.h * scale; // Half height
            sprite.x *= scale;
            sprite.y *= scale;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((sprite.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((sprite.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + hw;
            var north = normY + hh;
            var west = normX - hw;
            var south = normY - hh;
            var ne = Misc.rotateAroundOrigin(normX, normY, east, north, sprite.ang);
            var sw = Misc.rotateAroundOrigin(normX, normY, west, south, sprite.ang);
            var nw = Misc.rotateAroundOrigin(normX, normY, west, north, sprite.ang);
            var se = Misc.rotateAroundOrigin(normX, normY, east, south, sprite.ang);
            // Fill array with scaled vertices
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - se.x) * xm;
            drawData[i++] = normY - (normY - se.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - nw.x) * xm;
            drawData[i++] = normY - (normY - nw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_texture_coord']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 16, 8);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
        gl.disable(gl.BLEND);
    };
    BuildPlacementDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "varying vec2 v_texture_coord;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");
    BuildPlacementDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    vec4 sample = texture2D(u_sampler, v_texture_coord);",
        "    gl_FragColor = (sample + vec4(0.0,0.0,1.0,0.0)) / 1.5;",
        "}",
    ].join("\n");
    return BuildPlacementDrawer;
}());
var MinimapDrawer = (function () {
    function MinimapDrawer(canvas, spritemap) {
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, MinimapDrawer.vertexShader, MinimapDrawer.fragmentShader));
        this.spriteTex = gl.createTexture();
        this.spriteMap = spritemap;
        gl.bindTexture(gl.TEXTURE_2D, self.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    // (x,y) = minimap location on screen
    // (w,h) = size of minimap on screen
    // sprites = list of coords and spritemap ref { x: [0.0,1.0], y: [0.0,1.0], ref: 'wee_little_icon' }
    MinimapDrawer.prototype.draw = function (sprites) {
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_VERT = 4;
        var FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprite.ref);
            var hw = xywh.w; // Half width
            var hh = xywh.h; // Half height
            // Normalize X & Y
            // ScrnX = x * 2 - 1
            var normX = sprite.x * 2 - 1;
            var normY = sprite.y * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + hw;
            var north = normY + hh;
            var west = normX - hw;
            var south = normY - hh;
            // Fill array with scaled vertices
            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_texture_coord']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 16, 8);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
        gl.disable(gl.BLEND);
    };
    MinimapDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "varying vec2 v_texture_coord;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");
    MinimapDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    gl_FragColor = texture2D(u_sampler, v_texture_coord);",
        "}",
    ].join("\n");
    return MinimapDrawer;
}());
function createProgram(ctx, vertShaderSrc, fragShaderSrc) {
    var createShader = function (ctx, shaderSrc, shaderType) {
        var shader = ctx.createShader(shaderType);
        ctx.shaderSource(shader, shaderSrc);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
            console.error(ctx.getShaderInfoLog(shader));
            ctx.deleteShader(shader);
            return null;
        }
        return shader;
    };
    var program = ctx.createProgram();
    var vertShader = createShader(ctx, vertShaderSrc, ctx.VERTEX_SHADER);
    var fragShader = createShader(ctx, fragShaderSrc, ctx.FRAGMENT_SHADER);
    ctx.attachShader(program, vertShader);
    ctx.attachShader(program, fragShader);
    ctx.linkProgram(program);
    if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        console.error("Program Link error:", ctx.getProgramInfoLog(program));
        ctx.deleteProgram(program);
        ctx.deleteShader(vertShader);
        ctx.deleteShader(fragShader);
        return null;
    }
    return program;
}
var MetaProgram = (function () {
    function MetaProgram(gl, program) {
        this.program = program;
        this.attribute = {};
        this.uniform = {};
        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < count; i++) {
            var attrib = gl.getActiveAttrib(program, i);
            this.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }
        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < count; i++) {
            var uniform = gl.getActiveUniform(program, i);
            var name_1 = uniform.name.replace("[0]", "");
            this.uniform[name_1] = gl.getUniformLocation(program, name_1);
        }
    }
    return MetaProgram;
}());
/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */
// Not original source.
var TileDrawer = (function () {
    function TileDrawer(canvas, spriteSrc, tileSrc) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('webgl');
        var gl = this.ctx;
        this.program = new MetaProgram(gl, createProgram(gl, TileDrawer.vertexShader, TileDrawer.fragmentShader));
        this.tileTexture = gl.createTexture();
        this.spriteSheet = gl.createTexture();
        this.tileSize = 20;
        var self = this;
        var sprts = new Image();
        var tiles = new Image();
        sprts.onerror = function (e) {
            console.log('Failed to load ' + spriteSrc);
        };
        sprts.onload = function (e) {
            console.log('Loaded ' + spriteSrc);
            gl.bindTexture(gl.TEXTURE_2D, self.spriteSheet);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprts);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            self.spriteSheetScaleX = 1 / sprts.width;
            self.spriteSheetScaleY = 1 / sprts.height;
        };
        sprts.src = spriteSrc;
        tiles.onerror = function (e) {
            console.log('Failed to load ' + tileSrc);
        };
        tiles.onload = function (e) {
            console.log('Loaded ' + tileSrc);
            gl.bindTexture(gl.TEXTURE_2D, self.tileTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            self.tileTextureScaleX = 1 / tiles.width;
            self.tileTextureScaleY = 1 / tiles.height;
            self.mapWidth = tiles.width;
            self.mapHeight = tiles.height;
        };
        tiles.src = tileSrc;
        var buffer = [
            //x  y  u  v
            -1, -1, 0, 1,
            1, -1, 1, 1,
            1, 1, 1, 0,
            -1, -1, 0, 1,
            1, 1, 1, 0,
            -1, 1, 0, 0
        ];
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
    }
    TileDrawer.prototype.setTiles = function (tiles) {
        var gl = this.ctx;
        console.log('Loaded New Tiles');
        gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.tileTextureScaleX = 1 / tiles.width;
        this.tileTextureScaleY = 1 / tiles.height;
        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height;
    };
    TileDrawer.prototype.draw = function (x, y, scale) {
        var ss = scale * scale;
        y = this.mapHeight * this.tileSize - y;
        x = Math.floor(x / scale - this.canvas.offsetWidth / 2 / ss);
        y = Math.floor(y / scale - this.canvas.offsetHeight / 2 / ss);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var gl = this.ctx;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.program.attribute['position']);
        gl.enableVertexAttribArray(this.program.attribute['texture']);
        gl.vertexAttribPointer(this.program.attribute['position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['texture'], 2, gl.FLOAT, false, 16, 8);
        gl.uniform2f(this.program.uniform['viewportSize'], Math.floor(this.canvas.offsetWidth / scale), Math.floor(this.canvas.offsetHeight / scale));
        gl.uniform2f(this.program.uniform['inverseSpriteTextureSize'], this.spriteSheetScaleX, this.spriteSheetScaleY);
        gl.uniform2f(this.program.uniform['viewOffset'], Math.floor(x * scale), Math.floor(y * scale));
        gl.uniform2f(this.program.uniform['inverseTileTextureSize'], this.tileTextureScaleX, this.tileTextureScaleY);
        gl.uniform1f(this.program.uniform['tileSize'], this.tileSize);
        gl.uniform1f(this.program.uniform['inverseTileSize'], 1 / this.tileSize);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(this.program.uniform['tiles'], 1);
        gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.BLEND);
    };
    TileDrawer.vertexShader = [
        "attribute vec2 position;",
        "attribute vec2 texture;",
        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",
        "uniform vec2 viewOffset;",
        "uniform vec2 viewportSize;",
        "uniform vec2 inverseTileTextureSize;",
        "uniform float inverseTileSize;",
        "void main(void) {",
        "   pixelCoord = (texture * viewportSize) + viewOffset;",
        "   texCoord = pixelCoord * inverseTileTextureSize * inverseTileSize;",
        "   gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n");
    TileDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",
        "uniform sampler2D tiles;",
        "uniform sampler2D sprites;",
        "uniform vec2 inverseTileTextureSize;",
        "uniform vec2 inverseSpriteTextureSize;",
        "uniform float tileSize;",
        "void main(void) {",
        "   if(texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0) { discard; }",
        "   vec4 tile = texture2D(tiles, texCoord);",
        "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
        "   vec2 spriteCoord = mod(pixelCoord, tileSize);",
        "   gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        "}"
    ].join("\n");
    return TileDrawer;
}());
"use strict";
function main() {
    var mainMenu = document.getElementById('mainMenu');
    var content = document.getElementById('content');
    var chef = new Chef();
    var connectBtn = document.getElementById('connectBtn');
    var connected = false;
    var thingsLoaded = 0;
    var conn = null;
    var game = new Game();
    var fowCanvas = document.getElementById('fowCanvas');
    var drawCanvas = document.getElementById('drawCanvas');
    var minimapCanvas = document.getElementById('minimapCanvas');
    var ctrlDiv = document.getElementById('controlDiv');
    var cmdDiv = document.getElementById('commandDiv');
    var cmds = commands();
    game.chef = chef;
    game.inputState = new UserInput.InputState();
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/tileset.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.minimapBoxDrawer = new MinimapBoxDrawer(minimapCanvas);
    game.statusBarDrawer = new StatusBarDrawer(drawCanvas);
    game.commandPanel = new CommandPanel(cmdDiv, cmds, game.commandPanelHandler());
    var spritemap = new SpriteMap(spriteRefs(game.teamColors));
    spritemap.onload = function (e) {
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
        game.minimapDrawer = new MinimapDrawer(minimapCanvas, spritemap);
        game.buildPlacementDrawer = new BuildPlacementDrawer(drawCanvas, spritemap);
        mainMenu.appendChild(spritemap.spriteSheet);
    };
    connectBtn.onclick = function () {
        var nameFieldValue = document.getElementById('nameField').value;
        var passFieldValue = document.getElementById('passField').value;
        var addrFieldValue = document.getElementById('addrField').value;
        var portFieldValue = document.getElementById('portField').value;
        console.log('Attempting connection...');
        if (addrFieldValue === "localhost") {
            conn = new WebSocket('ws://localhost:' + portFieldValue);
        }
        else {
            conn = new WebSocket('ws://[' + addrFieldValue + ']:' + portFieldValue);
        }
        conn.binaryType = "arraybuffer";
        game.connection = conn;
        conn.onclose = function () {
            console.log('Connection closed.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        };
        conn.onmessage = function (event) {
            Decoding.processPacket(game, new Cereal(new DataView(event.data)));
        };
        conn.onopen = function () {
            console.log('Connection open.');
            mainMenu.hidden = true;
            content.hidden = false;
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            chef.putU8(Interaction.Core.ServerMessage.MapInfoRequest);
            chef.putU32(game.orderID++);
            conn.send(chef.done());
            game.connected = true;
            game.inputState.addListener(minimapCanvas, Interaction.Minimap.interact(game));
            game.inputState.addListener(ctrlDiv, Interaction.Core.interact(game));
            playGame(game);
        };
        conn.onerror = function () {
            console.log('Connection Error.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        };
    };
}
;
function playGame(game) {
    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }
    draw();
}
function commands() {
    var cmds = {};
    cmds["attack"] = { src: "img/attack.png", tooltip: "[A] Attack" };
    cmds["move"] = { src: "img/move.png", tooltip: "[M] Move" };
    cmds["build"] = { src: "img/build.png", tooltip: "[B] Build" };
    return cmds;
}
function spriteRefs(colors) {
    var tc_imgs = [
        {
            src: "img/basic_missile.png",
            ref: "basic_missile"
        },
        {
            src: "img/artillery_platform1.png",
            ref: "artillery_platform1"
        },
        {
            src: "img/artillery_wpn1.png",
            ref: "artillery_wpn1"
        },
        {
            src: "img/artillery_wpn2.png",
            ref: "artillery_wpn2"
        },
        {
            src: "img/missile1.png",
            ref: "missile1"
        },
        {
            src: "img/basic_unit.png",
            ref: "basic_unit"
        },
        {
            src: "img/basic_wpn.png",
            ref: "basic_wpn"
        },
        {
            src: "img/fast1.png",
            ref: "fast1"
        },
        {
            src: "img/fast_wpn1.png",
            ref: "fast_wpn1"
        },
        {
            src: "img/fast_msl1.png",
            ref: "fast_msl1"
        },
        {
            src: "img/fighter1.png",
            ref: "fighter1"
        },
        {
            src: "img/bomber1.png",
            ref: "bomber1"
        },
        {
            src: "img/minimap_unit.png",
            ref: "minimap_unit"
        },
    ];
    var list = new Array();
    for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        for (var n = 0; n < tc_imgs.length; n++) {
            var src = tc_imgs[n].src;
            var ref = tc_imgs[n].ref + color.name;
            list.push({ src: src, ref: ref, color: color });
        }
    }
    return list;
}
main();
var UnitDrawer = (function () {
    function UnitDrawer(canvas, spritemap) {
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, UnitDrawer.vertexShader, UnitDrawer.fragmentShader));
        this.spriteTex = gl.createTexture();
        this.spriteMap = spritemap;
        gl.bindTexture(gl.TEXTURE_2D, self.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    UnitDrawer.prototype.width = function () {
        return this.canvas.offsetWidth;
    };
    UnitDrawer.prototype.height = function () {
        return this.canvas.offsetHeight;
    };
    UnitDrawer.prototype.draw = function (x, y, scale, sprites) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_VERT = 4;
        var FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprite.ref);
            var hw = xywh.w * scale; // Half width
            var hh = xywh.h * scale; // Half height
            sprite.x *= scale;
            sprite.y *= scale;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((sprite.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((sprite.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + hw;
            var north = normY + hh;
            var west = normX - hw;
            var south = normY - hh;
            var ne = Misc.rotateAroundOrigin(normX, normY, east, north, sprite.ang);
            var sw = Misc.rotateAroundOrigin(normX, normY, west, south, sprite.ang);
            var nw = Misc.rotateAroundOrigin(normX, normY, west, north, sprite.ang);
            var se = Misc.rotateAroundOrigin(normX, normY, east, south, sprite.ang);
            // Fill array with scaled vertices
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - se.x) * xm;
            drawData[i++] = normY - (normY - se.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = normX - (normX - nw.x) * xm;
            drawData[i++] = normY - (normY - nw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_texture_coord']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 16, 8);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
        gl.disable(gl.BLEND);
    };
    UnitDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "varying vec2 v_texture_coord;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");
    UnitDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    gl_FragColor = texture2D(u_sampler, v_texture_coord);",
        "}",
    ].join("\n");
    return UnitDrawer;
}());
var BasicMissile = (function (_super) {
    __extends(BasicMissile, _super);
    function BasicMissile(c, time, frame, exploding) {
        _super.call(this, c, time, frame, exploding);
    }
    BasicMissile.prototype.copycat = function (misl) {
        _super.prototype.copycat.call(this, misl);
    };
    BasicMissile.prototype.clone = function () {
        var u = new BasicMissile(null, this.timeCreated, this.frameCreated, false);
        this.copycat(u);
        return u;
    };
    BasicMissile.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: "fast_msl1" + tc.name });
    };
    BasicMissile.prototype.renderExplosion = function (game, layers) {
    };
    BasicMissile.prototype.speed = function () {
        return 24.0;
    };
    return BasicMissile;
}(Missile));
var BasicStructure = (function (_super) {
    __extends(BasicStructure, _super);
    function BasicStructure(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }
    BasicStructure.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_facing = this.wpn_facing;
    };
    BasicStructure.prototype.clone = function () {
        var u = new BasicStructure(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    BasicStructure.prototype.sightRadius = function () {
        return 12;
    };
    BasicStructure.prototype.radius = function () {
        return 1.44;
    };
    BasicStructure.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    BasicStructure.prototype.commands = function (cmds) { };
    BasicStructure.prototype.buildables = function (blds) { };
    BasicStructure.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "artillery_platform1" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "artillery_wpn2" + tc.name });
    };
    BasicStructure.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    };
    return BasicStructure;
}(Unit));
var BasicUnit = (function (_super) {
    __extends(BasicUnit, _super);
    function BasicUnit(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }
    BasicUnit.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_facing = this.wpn_facing;
    };
    BasicUnit.prototype.clone = function () {
        var u = new BasicUnit(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    BasicUnit.prototype.sightRadius = function () {
        return 16;
    };
    BasicUnit.prototype.radius = function () {
        return 0.96;
    };
    BasicUnit.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    BasicUnit.prototype.commands = function (cmds) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['build'] = null;
    };
    BasicUnit.prototype.buildables = function (blds) { };
    BasicUnit.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_unit" + tc.name });
        var xy = Misc.rotatePoint(0, 0, this.facing);
        layers[2].push({ x: this.x + xy.x, y: this.y + xy.y, ang: this.wpn_facing, ref: "basic_wpn" + tc.name });
    };
    BasicUnit.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ref: "minimap_unit" + tc.name });
    };
    return BasicUnit;
}(Unit));
var Fast1 = (function (_super) {
    __extends(Fast1, _super);
    function Fast1(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
            this.wpn_anim = c.getU8();
        }
    }
    Fast1.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_anim = this.wpn_anim;
        unit.wpn_facing = this.wpn_facing;
    };
    Fast1.prototype.clone = function () {
        var u = new Fast1(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_anim = this.wpn_anim;
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    Fast1.prototype.sightRadius = function () {
        return 16;
    };
    Fast1.prototype.radius = function () {
        return 0.96;
    };
    Fast1.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    Fast1.prototype.commands = function (cmds) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['build'] = null;
    };
    Fast1.prototype.buildables = function (blds) { };
    Fast1.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "fast1" + tc.name });
        var xy = Misc.rotatePoint(-2, 0, this.facing);
        layers[2].push({ x: this.x + xy.x, y: this.y + xy.y, ang: this.wpn_facing, ref: "fast_wpn1" + tc.name });
    };
    Fast1.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ref: "minimap_unit" + tc.name });
    };
    return Fast1;
}(Unit));
//# sourceMappingURL=everythingatonce.js.map