"use strict";
class Game {
    constructor() {
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
        this.unitPrototypes = new Array();
        this.missilePrototypes = new Array();
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
        this.souls = Array(Game.MAX_UNITS);
        for (let i = 0; i < Game.MAX_UNITS; i++) {
            this.souls.push(null);
        }
        this.missileSouls = Array();
        for (let i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls.push(null);
        }
        this.teamColors = Array();
        let tc = new TeamColor();
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
    reset() {
        for (let i = 0; i < Game.MAX_UNITS; i++) {
            this.souls[i] = null;
        }
        for (let i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls[i] = null;
        }
    }
    commandPanelHandler() {
        let game = this;
        return function (name) {
            switch (name) {
                case "move":
                    game.control = new Interaction.MoveOrder.BeingIssued();
                    break;
                case "attack":
                    game.control = new Interaction.AttackMoveOrder.BeingIssued();
                    break;
                case "stop":
                    Interaction.StopOrder.issue(game);
                    break;
                default:
                    if (name.startsWith("build_")) {
                        game.buildOrderHandler(name.slice("build_".length));
                    }
                    else {
                        console.log('commandPanelHandler couldn\'t handle: ' + name);
                        game.control = new Interaction.Core.DoingNothing();
                    }
                    break;
            }
        };
    }
    buildOrderHandler(name) {
        for (let i = 0; i < this.unitPrototypes.length; i++) {
            let proto = this.unitPrototypes[i];
            if (proto.name === name) {
                let imgs = new Array();
                for (let img of proto.sprite_graphics) {
                    imgs.push(img.img_ref);
                }
                this.control = new Interaction.BuildOrder.BeingIssued(proto.width_and_height.w, proto.width_and_height.h, i, imgs);
            }
        }
    }
    draw() {
        let currentTime = Date.now();
        let timeDelta = (currentTime - this.lastDrawTime) * Game.FPS / 1000;
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
        this.drawResourceBars();
        this.lastDrawTime = currentTime;
    }
    drawResourceBars() {
        let primeBar = document.getElementById('primeBar');
        let primeOutput = document.getElementById('primeOutput');
        let primeDrain = document.getElementById('primeDrain');
        let primeMaximum = document.getElementById('primeMaximum');
        let primeAmount = document.getElementById('primeAmount');
        primeBar.style.width = Math.max(0.5, this.prime / this.maxPrime * 256) + "px";
        primeOutput.textContent = "+" + this.primeOutput.toFixed(1);
        primeDrain.textContent = "-" + this.primeDrain.toFixed(1);
        primeAmount.textContent = this.prime.toString();
        primeMaximum.textContent = this.maxPrime.toString();
        let energyBar = document.getElementById('energyBar');
        let energyOutput = document.getElementById('energyOutput');
        let energyDrain = document.getElementById('energyDrain');
        let energyMaximum = document.getElementById('energyMaximum');
        let energyAmount = document.getElementById('energyAmount');
        energyBar.style.width = Math.max(0.5, this.energy / this.maxEnergy * 256) + "px";
        energyOutput.textContent = "+" + this.energyOutput.toFixed(1);
        energyDrain.textContent = "-" + this.energyDrain.toFixed(1);
        energyAmount.textContent = this.energy.toString();
        energyMaximum.textContent = this.maxEnergy.toString();
    }
    stepUnits(timeDelta) {
        for (let i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.new && soul.old) {
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    }
    stepMissiles(timeDelta) {
        for (let i = 0; i < this.missileSouls.length; i++) {
            var soul = this.missileSouls[i];
            if (soul && soul.current && soul.old && soul.new) {
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    }
    drawPrimeNodes() {
        let nodes = new Array();
        for (let i = 0; i < this.primeNodes.length; i++) {
            let node = this.primeNodes[i];
            let x = node.x;
            let y = node.y;
            nodes.push({ x: x, y: y, ang: 0, ref: 'prime_node' });
        }
        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, nodes);
    }
    drawSelectBox() {
        let control = this.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            let scale = this.camera.scale;
            let width = this.unitDrawer.width();
            let height = this.unitDrawer.height();
            let x1 = (control.clickX - this.camera.x) * scale;
            let y1 = (control.clickY - this.camera.y) * scale;
            let x2 = (control.currentX - this.camera.x) * scale;
            let y2 = (control.currentY - this.camera.y) * scale;
            let minX = Math.min(x1, x2);
            let minY = Math.min(y1, y2);
            let maxX = Math.max(x1, x2);
            let maxY = Math.max(y1, y2);
            this.selectionBoxDrawer.draw(minX, minY, maxX, maxY);
        }
    }
    gameXY() {
        let self = this;
        return {
            x: (self.camera.x + (self.inputState.mouseX() - self.unitDrawer.width() / 2) / self.camera.scale) / Game.TILESIZE,
            y: (self.camera.y - (self.inputState.mouseY() - self.unitDrawer.height() / 2) / self.camera.scale) / Game.TILESIZE,
        };
    }
    drawBuildPlacement() {
        let control = this.control;
        let input = this.inputState;
        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            let layers = new Array();
            let xy = this.gameXY();
            let hw = control.width * 0.5;
            let hh = control.height * 0.5;
            let x = (Math.floor(xy.x - hw + 0.0001) + hw) * Game.TILESIZE;
            let y = (Math.floor(xy.y - hh + 0.0001) + hh) * Game.TILESIZE;
            for (let i = 0; i < control.imgs.length; i++) {
                layers.push({
                    x: x, y: y, ang: 0.0, ref: this.teamColors[this.team].name + '/' + control.imgs[i]
                });
            }
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, layers);
        }
    }
    drawMinimap() {
        let layers = new Array(10);
        for (let i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];
            if (soul) {
                soul.current.renderMinimap(this, layers);
            }
        }
        let flattened = new Array();
        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                let tmp = layers[i][n];
                tmp.x = tmp.x / Game.TILESIZE / this.mapWidth;
                tmp.y = tmp.y / Game.TILESIZE / this.mapHeight;
                flattened.push(tmp);
            }
        }
        let scale = this.camera.scale;
        let mapW = this.mapWidth * Game.TILESIZE;
        let mapH = this.mapHeight * Game.TILESIZE;
        let drawCanvas = document.getElementById('drawCanvas');
        let w = drawCanvas.clientWidth;
        let h = drawCanvas.clientHeight;
        let hw = w / 2 / scale;
        let hh = h / 2 / scale;
        let cx = this.camera.x;
        let cy = this.camera.y;
        let x1 = (cx - hw) / mapW * 2 - 1;
        let y1 = (cy - hh) / mapH * 2 - 1;
        let x2 = (cx + hw) / mapW * 2 - 1;
        let y2 = (cy + hh) / mapH * 2 - 1;
        this.minimapDrawer.draw(flattened);
        this.minimapBoxDrawer.draw(x1, y1, x2, y2);
    }
    drawUnitsAndMissiles() {
        let layers = new Array(10);
        for (let i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];
            if (soul) {
                soul.current.render(this, layers);
            }
        }
        for (let i = 0; i < this.missileSouls.length; i++) {
            let soul = this.missileSouls[i];
            if (soul) {
                if (soul.current.exploding) {
                    this.missileSouls[i] = null;
                }
                else {
                    soul.current.render(this, layers);
                }
            }
        }
        let flattened = new Array();
        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                flattened.push(layers[i][n]);
            }
        }
        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, flattened);
    }
    drawSelections() {
        let selections = new Array();
        let dashed = new Array();
        let enemy_selections = new Array();
        let enemy_dashed = new Array();
        let onlyEnemyIsBeingSelected = true;
        let onlyEnemyIsSelected = true;
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];
            if (soul) {
                if (soul.current.team === this.team) {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let radius = soul.current.collision_radius;
                    let r = 0;
                    let g = 255;
                    let b = 100;
                    let a = 255;
                    if (soul.current.is_selected) {
                        onlyEnemyIsSelected = false;
                        selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.is_being_selected) {
                        onlyEnemyIsBeingSelected = false;
                        dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
                else {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let radius = soul.current.collision_radius;
                    let r = 255;
                    let g = 0;
                    let b = 100;
                    let a = 255;
                    if (soul.current.is_selected && onlyEnemyIsSelected) {
                        enemy_selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.is_being_selected && onlyEnemyIsBeingSelected) {
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
    }
    drawStatusBars() {
        let bars = new Array();
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];
            if (soul && soul.current && soul.old) {
                let radius = soul.current.collision_radius;
                let x = soul.current.x;
                let y = soul.current.y + radius * Game.TILESIZE;
                let w = soul.current.collision_radius * Game.TILESIZE;
                let h = 1;
                if (soul.old.progress < 255) {
                    let v = soul.old.progress / 255;
                    let r = 125;
                    let g = 125;
                    let b = 125;
                    let a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.old.health < 255) {
                    let v = soul.old.health / 255;
                    let r = (255 - soul.old.health / 2);
                    let g = 200;
                    let b = soul.old.health;
                    let a = 255;
                    bars.push({ x: x, y: y, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
            }
        }
        this.statusBarDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, bars);
    }
    drawFogOfWar() {
        let circles = new Array();
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];
            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.sight_range });
                }
            }
        }
        this.fowDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, circles);
    }
}
Game.MAX_UNITS = 4096;
Game.TILESIZE = 20;
Game.PRIME_NODE_WIDTH = 3;
Game.FPS = 10;
class Camera {
    constructor(x, y, scale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
}
